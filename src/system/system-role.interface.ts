import type { UUID } from 'crypto';

export interface SystemRole {
  name: string;
  permissions: string[];
}

export interface UserAccessPermissions {
  id: UUID;
  // roles
  canCreateRoles: boolean;
  canReadRoles: boolean;
  canUpdateRoles: boolean;
  canDeleteRoles: boolean;
  // permissions
  canReadPermissions: boolean;
  // role permissions
  canAssignPermissionsToRoles: boolean;
  canUnassignPermissionsFromRoles: boolean;
  // departments
  canCreateDepartments: boolean;
  canReadDepartments: boolean;
  canUpdateDepartments: boolean;
  canDeleteDepartments: boolean;
  // store
  canCreateStore: boolean;
  canReadStore: boolean;
  canUpdateStore: boolean;
  canDeleteStore: boolean;
  // users
  canCreateUsers: boolean;
  canReadUsers: boolean;
  canUpdateUsers: boolean;
  canDeleteUsers: boolean;
  // user roles
  canReadUserRoles: boolean;
  canAssignUserToRoles: boolean;
  canUnassignUserFromRoles: boolean;
  // user store
  canReadUserStore: boolean;
  canAssignUserToStore: boolean;
  canUnassignUserFromStore: boolean;
  // user departments
  canReadUserDepartments: boolean;
  canAssignUserToDepartments: boolean;
  canUnassignUserFromDepartments: boolean;
}
