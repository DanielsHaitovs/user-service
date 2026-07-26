import type { JwtPayload } from '@/auth/auth.interface';
import {
  ASSIGN_USER_DEPARTMENT,
  CREATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  READ_DEPARTMENT,
  READ_USER_DEPARTMENT,
  UNASSIGN_USER_DEPARTMENT,
  UPDATE_DEPARTMENT,
} from '@/commonConst/department.const';
import {
  READ_PERMISSION,
  ROOT_ADMIN_PERMISSION,
} from '@/commonConst/permission.const';
import {
  ASSIGN_PERMISSION_TO_ROLE,
  CREATE_ROLE,
  DELETE_ROLE,
  READ_ROLE,
  READ_USER_ROLE,
  UNASSIGN_PERMISSION_FROM_ROLE,
  UPDATE_ROLE,
} from '@/commonConst/role.const';
import {
  ASSIGN_USER_STORE,
  CREATE_STORE,
  DELETE_STORE,
  READ_STORE,
  READ_USER_STORE,
  UNASSIGN_USER_STORE,
  UPDATE_STORE,
} from '@/commonConst/store.const';
import {
  CREATE_USER,
  DELETE_USER,
  READ_USER,
  UPDATE_USER,
} from '@/commonConst/user.const';
import type { UserAccessPermissions } from '@/system/system-role.interface';

export function extractAccess(
  createdByUser: JwtPayload,
): UserAccessPermissions {
  const { permissions, id } = createdByUser;

  function has(permission: string): boolean {
    if (permissions.includes(ROOT_ADMIN_PERMISSION)) {
      return true;
    }

    return permissions.includes(permission);
  }

  return {
    id,
    // role
    canCreateRoles: has(CREATE_ROLE),
    canReadRoles: has(READ_ROLE),
    canUpdateRoles: has(UPDATE_ROLE),
    canDeleteRoles: has(DELETE_ROLE),
    // permissions
    canReadPermissions: has(READ_PERMISSION),
    // role permissions
    canAssignPermissionsToRoles: has(ASSIGN_PERMISSION_TO_ROLE),
    canUnassignPermissionsFromRoles: has(UNASSIGN_PERMISSION_FROM_ROLE),
    // departments
    canCreateDepartments: has(CREATE_DEPARTMENT),
    canReadDepartments: has(READ_DEPARTMENT),
    canUpdateDepartments: has(UPDATE_DEPARTMENT),
    canDeleteDepartments: has(DELETE_DEPARTMENT),
    // store
    canCreateStore: has(CREATE_STORE),
    canReadStore: has(READ_STORE),
    canUpdateStore: has(UPDATE_STORE),
    canDeleteStore: has(DELETE_STORE),
    // users
    canCreateUsers: has(CREATE_USER),
    canReadUsers: has(READ_USER),
    canUpdateUsers: has(UPDATE_USER),
    canDeleteUsers: has(DELETE_USER),
    // user roles
    canReadUserRoles: has(READ_USER_ROLE),
    canAssignUserToRoles: has(UPDATE_USER),
    canUnassignUserFromRoles: has(UPDATE_USER),
    // user store
    canReadUserStore: has(READ_USER_STORE),
    canAssignUserToStore: has(ASSIGN_USER_STORE),
    canUnassignUserFromStore: has(UNASSIGN_USER_STORE),
    // user department
    canReadUserDepartments: has(READ_USER_DEPARTMENT),
    canAssignUserToDepartments: has(ASSIGN_USER_DEPARTMENT),
    canUnassignUserFromDepartments: has(UNASSIGN_USER_DEPARTMENT),
  };
}
