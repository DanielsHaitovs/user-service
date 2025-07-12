import { RoleQueryService } from '@/role/services/query.service';
import { getUserSelectableFields } from '@/user/helper/user-fields.util';
import { UserQueryService } from '@/user/services/query.service';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

interface JWTPayload {
  permissions: string[];
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserQueryService,
    private readonly roleService: RoleQueryService,
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

  async validate(payload: JWTPayload): Promise<{
    permissions: string[];
  }> {
    const { users } = await this.userService.getUsers({
      query: { emails: [payload.email] },
      includeRoles: true,
      pagination: { limit: 1, page: 1 },
      sort: { sortField: 'createdAt', sortOrder: 'DESC' },
      selectUserFields: getUserSelectableFields(['id', 'email', 'isActive']),
      selectRoleFields: ['id', 'name'],
    });

    if (users[0] === undefined) {
      throw new UnauthorizedException('Authentication failed');
    }

    if (!users[0].isActive) {
      throw new UnauthorizedException(
        'User is not active, if you think this is an mistake please contact support',
      );
    }

    const { userRoles } = users[0];

    if (userRoles.length === 0) {
      throw new ForbiddenException(
        'User has no roles assigned, please contact support',
      );
    }

    const roleIds = userRoles.map((userRole) => userRole.role.id);

    const assignedRoles = await this.roleService.getRoles({
      rolesQuery: {
        ids: roleIds,
      },
      includePermissions: true,
      permissionsQuery: {},
      pagination: { limit: 500, page: 1 },
      sort: { sortField: 'createdAt', sortOrder: 'DESC' },
    });

    if (assignedRoles.roles.length === 0) {
      throw new ForbiddenException(
        `User has no permissions assigned, please contact support, roles: ${roleIds.join(', ')}`,
      );
    }

    return {
      permissions: assignedRoles.roles.flatMap((role) =>
        (role.permissions ?? []).map((permission) => permission.code),
      ),
    };
  }
}
