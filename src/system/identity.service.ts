import {
  PERMISSION_QUERY_ALIAS,
  ROOT_ADMIN_PERMISSION,
} from '@/commonConst/permission.const';
import { ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { Permission } from '@/permissionEntities/permissions.entity';
import { Roles } from '@/roleEntities/role.entity';
import {
  ROLE_TO_CREATE_DEPARTMENT,
  ROLE_TO_DELETE_DEPARTMENT,
  ROLE_TO_READ_DEPARTMENT,
  ROLE_TO_UPDATE_DEPARTMENT,
} from '@/system/const/department.const';
import { ROLE_TO_READ_PERMISSION } from '@/system/const/permission.const';
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
import type { SystemRole } from '@/system/system-role.interface';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityManager } from 'typeorm';

@Injectable()
export class SystemIdentityService {
  private systemUserId: UUID | undefined;
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
    ROLE_TO_READ_PERMISSION,
    ROLE_TO_CREATE_DEPARTMENT,
    ROLE_TO_READ_DEPARTMENT,
    ROLE_TO_UPDATE_DEPARTMENT,
    ROLE_TO_DELETE_DEPARTMENT,
    ROLE_TO_READ_USER_DEPARTMENT,
    ROLE_TO_ASSIGN_DEPARTMENT_TO_USER,
    ROLE_TO_UNASSIGN_DEPARTMENT_TO_USER,
  ];
  private readonly systemRoleNames: string[] = this.systemRoles.map(
    (role) => role.name,
  );

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * Sets the system user ID. This should only be called once during application bootstrap after the system user has been created or verified to exist.
   * @param id The UUID of the system user.
   */
  setSystemUserId(id: UUID): void {
    this.systemUserId = id;
  }

  /**
   * Retrieves the system user ID. Throws an error if the system user ID has not been initialized.
   * @returns The UUID of the system user.
   * @throws InternalServerErrorException if the system user ID has not been initialized.
   */
  getSystemUserId(): UUID {
    if (this.systemUserId == undefined) {
      throw new InternalServerErrorException(
        'System User ID has not been initialized yet.',
      );
    }

    return this.systemUserId;
  }

  /**
   * Retrieves the list of system roles defined in the application.
   * @returns An array of SystemRole objects representing the system roles.
   */
  getSystemRoles(): SystemRole[] {
    return this.systemRoles;
  }

  /**
   * Retrieves the names of the system roles defined in the application.
   * @returns An array of strings representing the names of the system roles.
   */
  getSystemRoleNames(): string[] {
    return this.systemRoleNames;
  }

  /**
   * Retrieves the IDs of the system roles from the database based on their names. If no system roles are defined, an empty array is returned.
   * @returns A promise that resolves to an array of UUIDs representing the IDs of the system roles.
   */
  async getSystemRoleIds(): Promise<UUID[]> {
    if (this.systemRoles.length === 0) {
      return [];
    }

    const roles = await this.entityManager
      .createQueryBuilder(Roles, ROLE_QUERY_ALIAS)
      .where(`${ROLE_QUERY_ALIAS}.name IN (:...names)`, {
        names: this.systemRoleNames,
      })
      .select(`${ROLE_QUERY_ALIAS}.id`)
      .getMany();

    return roles.map((role) => role.id);
  }

  /**
   * Retrieves the unique set of permission codes associated with all system roles. This method aggregates permissions from all system roles and returns a deduplicated list of permission codes.
   * @returns An array of strings representing the unique permission codes for all system roles.
   */
  getPermissionsForSystemRoles(): string[] {
    if (this.systemRoles.length === 0) {
      return [];
    }

    return Array.from(
      new Set(this.systemRoles.flatMap((role) => role.permissions)),
    );
  }

  /**
   * Retrieves the IDs and codes of permissions associated with the system roles from the database. This method first obtains the unique permission codes for all system roles and then queries the database to retrieve their corresponding IDs and codes. If no permissions are associated with the system roles, an empty array is returned.
   * @returns A promise that resolves to an array of objects, each containing the ID and code of a permission associated with the system roles.
   */
  async getSystemPermissionsIds(): Promise<{ id: UUID; code: string }[]> {
    const permissionCodes = this.getPermissionsForSystemRoles();

    if (permissionCodes.length === 0) {
      return [];
    }

    return await this.entityManager
      .createQueryBuilder(Permission, PERMISSION_QUERY_ALIAS)
      .where(`${PERMISSION_QUERY_ALIAS}.code IN (:...codes)`, {
        codes: permissionCodes,
      })
      .select([
        `${PERMISSION_QUERY_ALIAS}.id`,
        `${PERMISSION_QUERY_ALIAS}.code`,
      ])
      .getMany();
  }
}
