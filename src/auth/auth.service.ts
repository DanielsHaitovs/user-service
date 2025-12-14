import { LoginDto } from '@/authDto/auth.dto';
import { JWTPayload } from '@/authInterfaces/req.interface';
import {
  PERMISSION_QUERY_ALIAS,
  ROOT_ADMIN_PERMISSION,
} from '@/libConst/permission.const';
import { ROLE_QUERY_ALIAS } from '@/libConst/role.const';
import {
  SYSTEM_USER_EMAIL,
  USER_QUERY_ALIAS,
  USER_ROLE_QUERY_ALIAS,
} from '@/libConst/user.const';
import { User } from '@/userEntities/user.entity';
import { getUserGenericSelectableFields } from '@/userHelper/user-fields.util';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectEntityManager } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { UUID } from 'crypto';
import { EntityManager } from 'typeorm';

@Injectable()
export class AuthService {
  private readonly unauthorizedException = 'Invalid credentials';
  private readonly invalidCredentialsException = 'Invalid credentials';

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto): Promise<{ access_token: string }> {
    const { permissions, id } = await this.validateUser({
      email: data.email,
      password: data.password,
      checkPassword: true,
    });

    const access_token = this.jwtService.sign({
      id,
      permissions,
    });

    return {
      access_token,
    };
  }

  async validateUser(data: {
    email?: string;
    id?: UUID;
    password?: string;
    checkPassword?: boolean;
  }): Promise<JWTPayload> {
    const { email, id, password, checkPassword } = data;

    if (email === undefined && id === undefined) {
      throw new UnauthorizedException(this.unauthorizedException);
    }

    const user = await this.getUserByWithPermissions({ id, email });

    if (user.email === SYSTEM_USER_EMAIL) {
      return {
        id: user.id,
        permissions: [ROOT_ADMIN_PERMISSION],
      };
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'User is not active, if you think this is an mistake please contact support',
      );
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('User was not verified');
    }

    if (checkPassword !== undefined && checkPassword) {
      if (password === undefined) {
        throw new UnauthorizedException(this.unauthorizedException);
      }

      if (!(await bcrypt.compare(password, user.password))) {
        throw new UnauthorizedException(this.unauthorizedException);
      }
    }

    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((userRole) =>
          userRole.roles.permissions.map((permission) => permission.code),
        ),
      ),
    );

    return {
      id: user.id,
      permissions,
    };
  }

  private async getUserByWithPermissions(data: {
    id?: UUID | undefined;
    email?: string | undefined;
  }): Promise<User> {
    if (
      process.env.REQUIRE_AUTH === 'false' &&
      process.env.NODE_ENV === 'development'
    ) {
      data.email = SYSTEM_USER_EMAIL;
      delete data.id;
    }

    const { id, email } = data;

    if (id == undefined && email == undefined) {
      throw new UnauthorizedException(this.invalidCredentialsException);
    }

    const query = this.entityManager.createQueryBuilder(User, USER_QUERY_ALIAS);

    if (id !== undefined) {
      query.where(`${USER_QUERY_ALIAS}.id = :id`, { id });
    } else if (email !== undefined) {
      query.where(`${USER_QUERY_ALIAS}.email = :email`, { email });
    } else {
      throw new UnauthorizedException(this.invalidCredentialsException);
    }

    query
      .leftJoinAndSelect(
        `${USER_QUERY_ALIAS}.${USER_ROLE_QUERY_ALIAS}`,
        USER_ROLE_QUERY_ALIAS,
      )
      .leftJoinAndSelect(`${USER_ROLE_QUERY_ALIAS}.role`, ROLE_QUERY_ALIAS)
      .leftJoinAndSelect(
        `${ROLE_QUERY_ALIAS}.${PERMISSION_QUERY_ALIAS}`,
        PERMISSION_QUERY_ALIAS,
      );

    return await query
      .select([
        ...getUserGenericSelectableFields({
          fields: [
            'id',
            'email',
            'firstName',
            'lastName',
            'isActive',
            'isEmailVerified',
            'isTwoFactorEnabled',
            'password',
          ],
        }),
        `${USER_ROLE_QUERY_ALIAS}.id`,
        `${USER_ROLE_QUERY_ALIAS}.role`,
        `${ROLE_QUERY_ALIAS}.id`,
        `${PERMISSION_QUERY_ALIAS}.id`,
        `${PERMISSION_QUERY_ALIAS}.code`,
      ])
      .getOneOrFail();
  }
}
