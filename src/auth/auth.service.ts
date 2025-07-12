import { LoginDto } from '@/auth/dto/auth.dto';
import { RoleQueryService } from '@/role/services/query.service';
import { UserResponseDto } from '@/user/dto/user.dto';
import { getUserSelectableFields } from '@/user/helper/user-fields.util';
import { UserQueryService } from '@/user/services/query.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserQueryService,
    private readonly roleService: RoleQueryService,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto): Promise<{ access_token: string }> {
    const { permissions } = await this.validateUser(data.email, data.password);

    return {
      access_token: this.jwtService.sign({
        email: data.email,
        permissions,
      }),
    };
  }

  private async validateUser(
    email: string,
    pass: string,
  ): Promise<{ user: UserResponseDto; permissions: string[] }> {
    const { users } = await this.userService.getUsers({
      query: { emails: [email] },
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
        'password',
      ]),
      selectDepartmentFields: ['id', 'name', 'country'],
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

    if (!(await bcrypt.compare(pass, users[0].password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { userRoles } = users[0];

    if (userRoles.length === 0) {
      throw new UnauthorizedException(
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
      throw new UnauthorizedException(
        `User has no permissions assigned, please contact support, roles: ${roleIds.join(', ')}`,
      );
    }

    const userPermissions = assignedRoles.roles.flatMap((role) =>
      (role.permissions ?? []).map((permission) => permission.code),
    );

    return { user: users[0], permissions: userPermissions };
  }
}
