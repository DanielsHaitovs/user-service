import { EnvConfigService } from '@/config/env/env.config.service';
import { COUNTRIES } from '@/libConst/countries.const';
import {
  PERMISSION_QUERY_ALIAS,
  ROOT_ADMIN_PERMISSION,
} from '@/libConst/permission.const';
import { ROLE_QUERY_ALIAS } from '@/libConst/role.const';
import {
  EXAMPLE_USER_DATE_OF_BIRTH,
  EXAMPLE_USER_EMAIL_VERIFICATION_TOKEN,
  EXAMPLE_USER_PASSWORD_RESET_TOKEN,
  EXAMPLE_USER_PHONE,
  SYSTEM_USER_EMAIL,
  SYSTEM_USER_PASSWORD,
} from '@/libConst/user.const';
import { Roles } from '@/role/entities/role.entity';
import { Permission } from '@/role/permission/entities/permissions.entity';
import {
  ROLE_TO_CREATE_DEPARTMENT,
  ROLE_TO_DELETE_DEPARTMENT,
  ROLE_TO_READ_DEPARTMENT,
  ROLE_TO_UPDATE_DEPARTMENT,
} from '@/system/const/department.const';
import {
  ROLE_TO_CREATE_PERMISSION,
  ROLE_TO_DELETE_PERMISSION,
  ROLE_TO_READ_PERMISSION,
  ROLE_TO_UPDATE_PERMISSION,
} from '@/system/const/permission.const';
import {
  ROLE_TO_ASSIGN_PERMISSION_TO_ROLE,
  ROLE_TO_CREATE_ROLE,
  ROLE_TO_DELETE_ROLE,
  ROLE_TO_READ_ROLE,
  ROLE_TO_READ_ROLE_WITH_PERMISSIONS,
  ROLE_TO_UNASSIGN_PERMISSION_FROM_ROLE,
  ROLE_TO_UPDATE_ROLE,
} from '@/system/const/role.const';
import {
  ROLE_TO_CREATE_STORE,
  ROLE_TO_DELETE_STORE,
  ROLE_TO_READ_STORE,
  ROLE_TO_UPDATE_STORE,
} from '@/system/const/store.const';
import {
  ROLE_TO_ASSIGN_DEPARTMENT_TO_USER,
  ROLE_TO_ASSIGN_ROLE_TO_USER,
  ROLE_TO_ASSIGN_USER_STORE,
  ROLE_TO_CREATE_USER,
  ROLE_TO_DELETE_USER,
  ROLE_TO_READ_USER,
  ROLE_TO_READ_USER_DEPARTMENT,
  ROLE_TO_READ_USER_PERMISSIONS,
  ROLE_TO_READ_USER_ROLE,
  ROLE_TO_UNASSIGN_DEPARTMENT_TO_USER,
  ROLE_TO_UNASSIGN_ROLE_FROM_USER,
  ROLE_TO_UNASSIGN_USER_STORE,
  ROLE_TO_UPDATE_USER,
} from '@/system/const/user.const';
import { SystemIdentityService } from '@/system/identity.service';
import { SystemRole } from '@/system/system-role.interface';
import { User } from '@/user/entities/user.entity';
import { UserRoles } from '@/user/entities/userRoles.entity';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { UUID } from 'crypto';
import { EntityManager } from 'typeorm';

@Injectable()
export class SystemSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SystemSeedService.name);
  private readonly systemRoles: SystemRole[] = [
    { name: 'ADMIN', permissions: [ROOT_ADMIN_PERMISSION] },
    ROLE_TO_CREATE_STORE,
    ROLE_TO_READ_STORE,
    ROLE_TO_UPDATE_STORE,
    ROLE_TO_DELETE_STORE,
    ROLE_TO_ASSIGN_USER_STORE,
    ROLE_TO_UNASSIGN_USER_STORE,
    ROLE_TO_CREATE_ROLE,
    ROLE_TO_READ_ROLE,
    ROLE_TO_UPDATE_ROLE,
    ROLE_TO_DELETE_ROLE,
    ROLE_TO_ASSIGN_ROLE_TO_USER,
    ROLE_TO_UNASSIGN_ROLE_FROM_USER,
    ROLE_TO_READ_USER_ROLE,
    ROLE_TO_READ_USER_PERMISSIONS,
    ROLE_TO_ASSIGN_PERMISSION_TO_ROLE,
    ROLE_TO_UNASSIGN_PERMISSION_FROM_ROLE,
    ROLE_TO_READ_ROLE_WITH_PERMISSIONS,
    ROLE_TO_CREATE_USER,
    ROLE_TO_READ_USER,
    ROLE_TO_UPDATE_USER,
    ROLE_TO_DELETE_USER,
    ROLE_TO_CREATE_PERMISSION,
    ROLE_TO_READ_PERMISSION,
    ROLE_TO_UPDATE_PERMISSION,
    ROLE_TO_DELETE_PERMISSION,
    ROLE_TO_CREATE_DEPARTMENT,
    ROLE_TO_READ_DEPARTMENT,
    ROLE_TO_UPDATE_DEPARTMENT,
    ROLE_TO_DELETE_DEPARTMENT,
    ROLE_TO_READ_USER_DEPARTMENT,
    ROLE_TO_ASSIGN_DEPARTMENT_TO_USER,
    ROLE_TO_UNASSIGN_DEPARTMENT_TO_USER,
  ];

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly systemIdentityService: SystemIdentityService,
    private readonly envConfigService: EnvConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const systemUserExists = await this.entityManager.findOne(User, {
        where: { email: SYSTEM_USER_EMAIL },
      });

      let systemUserId = systemUserExists?.id;

      if (!systemUserExists) {
        systemUserId = (await this.createSystemUser()).id;
        this.logger.debug('System user created successfully!');
      } else {
        this.logger.debug('System user already exists!');
      }

      if (systemUserId != undefined) {
        this.systemIdentityService.setSystemUserId(systemUserId);
        this.logger.debug('Creating system roles and permissions!');

        const rolesMap = await this.createSystemRoles(systemUserId);

        const adminRoleId = rolesMap.get('ADMIN');

        if (adminRoleId == undefined) {
          this.logger.error(
            'ADMIN role not found, cannot assign to system user!',
          );

          return;
        }

        const permissionsMap = await this.createSystemPermissions(systemUserId);

        await this.assignPermissionsToRoles(rolesMap, permissionsMap);

        this.logger.debug(
          'System roles and permissions are created and successfully assigned!',
        );

        const existingUserRole = await this.entityManager.findOne(UserRoles, {
          where: {
            user: { id: systemUserId },
            role: { id: adminRoleId },
          },
        });

        if (existingUserRole) {
          this.logger.debug(
            'System user already has ADMIN role assigned, skipping assignment!',
          );
          return;
        }

        const systemUserRole = this.entityManager.create(UserRoles, {
          user: { id: systemUserId },
          role: { id: adminRoleId },
          assignedBy: { id: systemUserId },
        });

        await this.entityManager.save(systemUserRole);

        this.logger.debug('Assigned ADMIN role to system user successfully!');
      }
    } catch (error) {
      this.logger.error('Error creating system user', error);
    }
  }

  async createSystemUser(): Promise<User> {
    const password = await bcrypt.hash(
      SYSTEM_USER_PASSWORD,
      this.envConfigService.passwordSaltRounds,
    );
    const systemUser = this.entityManager.create(User, {
      firstName: 'System',
      lastName: 'User',
      email: SYSTEM_USER_EMAIL,
      password,
      phone: EXAMPLE_USER_PHONE,
      country: COUNTRIES.US,
      dateOfBirth: new Date(EXAMPLE_USER_DATE_OF_BIRTH),
      emailVerificationToken: EXAMPLE_USER_EMAIL_VERIFICATION_TOKEN,
      passwordResetToken: EXAMPLE_USER_PASSWORD_RESET_TOKEN,
      twoFactorSecret: EXAMPLE_USER_PASSWORD_RESET_TOKEN,
    });

    return await this.entityManager.save(systemUser);
  }

  private async createSystemRoles(
    systemUserId: UUID,
  ): Promise<Map<string, UUID>> {
    const rolesMap = new Map<string, UUID>();

    const uniqueNames = new Set<string>();
    for (const role of this.systemRoles) {
      uniqueNames.add(role.name);
    }

    const roleNamesArray = Array.from(uniqueNames);

    if (roleNamesArray.length === 0) {
      return rolesMap;
    }

    const existingRoles = await this.entityManager
      .createQueryBuilder(Roles, ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.name IN (:...names)`, {
        names: roleNamesArray,
      })
      .getMany();

    const existingNames = new Set<string>();

    for (const role of existingRoles) {
      rolesMap.set(role.name, role.id);
      existingNames.add(role.name);
    }

    const newRoles: Roles[] = [];
    const createdNames: string[] = [];

    for (const name of uniqueNames) {
      if (!existingNames.has(name)) {
        newRoles.push(
          this.entityManager.create(Roles, {
            name,
            createdBy: { id: systemUserId },
          }),
        );
        createdNames.push(name);
      }
    }

    if (newRoles.length > 0) {
      const savedRoles = await this.entityManager.save(newRoles);
      this.logger.debug(`Created system roles: ${createdNames.join(', ')}!`);

      for (const role of savedRoles) {
        rolesMap.set(role.name, role.id);
      }
    }

    return rolesMap;
  }

  private async createSystemPermissions(
    systemUserId: UUID,
  ): Promise<Map<string, UUID>> {
    const permissionsMap = new Map<string, UUID>();

    const uniqueCodes = Array.from(
      new Set(this.systemRoles.flatMap((role) => role.permissions)),
    );

    if (uniqueCodes.length === 0) {
      return permissionsMap;
    }

    const existingPermissions = await this.entityManager
      .createQueryBuilder(Permission, PERMISSION_QUERY_ALIAS)
      .where(`${PERMISSION_QUERY_ALIAS}.code IN (:...codes)`, {
        codes: uniqueCodes,
      })
      .getMany();

    const existingNames = new Set<string>();

    for (const permission of existingPermissions) {
      permissionsMap.set(permission.code, permission.id);
      existingNames.add(permission.code);
    }

    const newPermissions: Permission[] = [];
    const createdNames: string[] = [];

    for (const code of uniqueCodes) {
      if (!existingNames.has(code)) {
        newPermissions.push(
          this.entityManager.create(Permission, {
            name: code.replace(/\s+/g, '_').toUpperCase(),
            code,
            createdBy: { id: systemUserId },
          }),
        );
        createdNames.push(code);
      }
    }

    if (newPermissions.length > 0) {
      const savedPermissions = await this.entityManager.save(newPermissions);

      this.logger.debug(`Created permissions: ${createdNames.join(', ')}!`);

      for (const permission of savedPermissions) {
        permissionsMap.set(permission.name, permission.id);
      }
    }

    return permissionsMap;
  }

  private async assignPermissionsToRoles(
    rolesMap: Map<string, UUID>,
    permissionsMap: Map<string, UUID>,
  ): Promise<void> {
    if (rolesMap.size === 0) {
      this.logger.warn('No system roles found to assign permissions to!');
      return;
    }

    if (permissionsMap.size === 0) {
      this.logger.warn('No system permissions found to assign to roles!');
      return;
    }

    for (const systemRole of this.systemRoles) {
      const { name, permissions } = systemRole;
      const roleId = rolesMap.get(name);
      const permissionIds = permissions
        .map((permissionName) => permissionsMap.get(permissionName))
        .filter((id): id is UUID => id !== undefined);

      if (roleId == undefined || permissionIds.length === 0) {
        continue;
      }

      const role = this.entityManager.create(Roles, {
        id: roleId,
        permissions: permissionIds.map((id) => ({ id })),
      });

      await this.entityManager.save(role);
    }
  }
}
