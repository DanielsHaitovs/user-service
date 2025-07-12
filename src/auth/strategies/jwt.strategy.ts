import { UserResponseDto } from '@/user/dto/user.dto';
import { getUserSelectableFields } from '@/user/helper/user-fields.util';
import { UserQueryService } from '@/user/services/query.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: number;
  email: string;
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserQueryService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (secret === undefined) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(
    payload: JwtPayload,
  ): Promise<{ user: UserResponseDto; permissions: string[] }> {
    try {
      const { users } = await this.userService.getUsers({
        query: { emails: [payload.email] },
        includeDepartment: true,
        includeRoles: true,
        pagination: { limit: 1, page: 1 },
        sort: { sortField: 'createdAt', sortOrder: 'DESC' },
        selectUserFields: getUserSelectableFields([
          'id',
          'email',
          'firstName',
          'lastName',
          'isActive',
          'isTwoFactorEnabled',
        ]),
        selectDepartmentFields: ['id', 'name', 'country'],
        selectRoleFields: ['id', 'name'],
      });

      if (users[0] === undefined) {
        throw new UnauthorizedException('Authentication failed');
      }

      return { user: users[0], permissions: payload.permissions };
    } catch {
      throw new UnauthorizedException();
    }
  }
}
