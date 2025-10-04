import { LoginDto } from '@/auth/dto/auth.dto';
import { JWTPayload } from '@/auth/interfaces/req.interface';
import {
  PERMISSION_QUERY_ALIAS,
  ROLE_QUERY_ALIAS,
} from '@/lib/const/role.const';
import {
  USER_QUERY_ALIAS,
  USER_ROLE_QUERY_ALIAS,
} from '@/lib/const/user.const';
import { User } from '@/user/entities/user.entity';
import { UserRole } from '@/user/entities/userRoles.entity';
import { getUserSelectableFields } from '@/user/helper/user-fields.util';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectEntityManager } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { UUID } from 'crypto';
import { EntityManager } from 'typeorm';

@Injectable()
export class AuthService {
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
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.getUserBy({ id, email });

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
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!(await bcrypt.compare(password, user.password))) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    const permissions = await this.getUserPermissions(user.id);

    return {
      id: user.id,
      permissions,
    };
  }

  private async getUserBy(data: {
    id?: UUID | undefined;
    email?: string | undefined;
  }): Promise<User> {
    const { id, email } = data;

    if (id == undefined && email == undefined) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const query = this.entityManager.createQueryBuilder(User, USER_QUERY_ALIAS);

    if (id !== undefined) {
      query.where(`${USER_QUERY_ALIAS}.id = :id`, { id });
    } else if (email !== undefined) {
      query.where(`${USER_QUERY_ALIAS}.email = :email`, { email });
    }
    return await query
      .select(
        getUserSelectableFields([
          'id',
          'email',
          'firstName',
          'lastName',
          'isActive',
          'isEmailVerified',
          'isTwoFactorEnabled',
          'password',
        ]),
      )
      .getOneOrFail();
  }

  private async getUserPermissions(userId: UUID): Promise<string[]> {
    const userRoleWithPermissions = await this.entityManager
      .createQueryBuilder(UserRole, USER_ROLE_QUERY_ALIAS)
      .leftJoinAndSelect(
        `${USER_ROLE_QUERY_ALIAS}.${ROLE_QUERY_ALIAS}`,
        ROLE_QUERY_ALIAS,
      )
      .leftJoinAndSelect(
        `${ROLE_QUERY_ALIAS}.${PERMISSION_QUERY_ALIAS}`,
        PERMISSION_QUERY_ALIAS,
      )
      .where(`${USER_ROLE_QUERY_ALIAS}.userId = :userId`, { userId })
      .getMany();

    if (userRoleWithPermissions.length === 0) {
      throw new UnauthorizedException(
        'User has no roles assigned, please contact support',
      );
    }

    const userRoles = userRoleWithPermissions.map((ur) => ur.roles);

    const permissions = userRoles.flatMap((role) =>
      role.permissions.map((permission) => permission.code),
    );

    if (permissions.length === 0) {
      throw new UnauthorizedException(
        'User has no permissions assigned, please contact support',
      );
    }

    return permissions;
  }
}
