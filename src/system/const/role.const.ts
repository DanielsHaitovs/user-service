import { READ_PERMISSION } from '@/libConst/permission.const';
import {
  ASSIGN_PERMISSION_TO_ROLE,
  CREATE_ROLE,
  DELETE_ROLE,
  READ_ROLE,
  READ_USER_ROLE,
  UNASSIGN_PERMISSION_FROM_ROLE,
  UNASSIGN_USER_ROLE,
  UPDATE_ROLE,
} from '@/libConst/role.const';
import type { SystemRole } from '@/system/system-role.interface';

/**
 * Permissions required to update a role.
 *
 * This array defines the permissions that are required to access the endpoint for updating a role.
 * It includes the following permissions:
 * - `UPDATE_ROLE`: Permission to update a role, which is necessary to perform the update operation.
 * - `READ_ROLE`: Permission to read role information, which may be necessary for validation or other operations during role updates.
 *
 * By requiring these permissions, the system ensures that only authorized users can update roles and have the necessary access to related information.
 */
export const UPDATE_ROLE_ENDPOINT_PERMISSION = [
  UPDATE_ROLE,
  READ_ROLE,
] as string[];

/**
 * Permissions required to delete a role.
 *
 * This array defines the permissions that are required to access the endpoint for deleting a role.
 * It includes the following permissions:
 * - `DELETE_ROLE`: Permission to delete a role, which is necessary to perform the delete operation.
 * - `READ_ROLE`: Permission to read role information, which may be necessary for validation or other operations during role deletion.
 *
 * By requiring these permissions, the system ensures that only authorized users can delete roles and have the necessary access to related information.
 */
export const DELETE_ROLE_ENDPOINT_PERMISSION = [
  DELETE_ROLE,
  READ_ROLE,
  READ_USER_ROLE,
  UNASSIGN_USER_ROLE,
] as string[];

/**
 * Permissions required to Create a new role.
 *
 * This array defines the permissions that are required to access the endpoint for creating role.
 * It includes the following permissions:
 * - `CREATE_ROLE`: Permission to create a new role.
 * - `READ_ROLE`: Permission to read role information, which may be necessary for validation or other operations during role creation.
 * - `READ_PERMISSION`: Permission to read permissions, which may be necessary to assign permissions to the new role during creation.
 *
 * By requiring these permissions, the system ensures that only authorized users can create new roles and have the necessary access to related information.
 */
export const CREATE_ROLE_ENDPOINT_PERMISSION = [
  CREATE_ROLE,
  READ_ROLE,
  READ_PERMISSION,
  ASSIGN_PERMISSION_TO_ROLE,
] as string[];

/**
 * Permissions required to read role information.
 *
 * This array defines the permissions that are required to access the endpoint for reading role information.
 * It includes the following permission:
 * - `READ_ROLE`: Permission to read role information, which is necessary to access the details of roles in the system.
 *
 * By requiring this permission, the system ensures that only authorized users can access role information and maintain the security of role data.
 */
export const READ_ROLE_ENDPOINT_PERMISSION = [READ_ROLE] as string[];

export const ROLE_TO_CREATE_ROLE: SystemRole = {
  name: 'Create Role',
  permissions: CREATE_ROLE_ENDPOINT_PERMISSION,
};
export const ROLE_TO_READ_ROLE: SystemRole = {
  name: 'Read Role',
  permissions: READ_ROLE_ENDPOINT_PERMISSION,
};
export const ROLE_TO_UPDATE_ROLE: SystemRole = {
  name: 'Update Role',
  permissions: UPDATE_ROLE_ENDPOINT_PERMISSION,
};
export const ROLE_TO_DELETE_ROLE: SystemRole = {
  name: 'Delete Role',
  permissions: DELETE_ROLE_ENDPOINT_PERMISSION,
};

// PERMISSION
/**
 * Permissions required to assign permissions to a role.
 *
 * This array defines the permissions that are required to access the endpoint for assigning permissions to a role.
 * It includes the following permissions:
 * - `ASSIGN_PERMISSION_TO_ROLE`: Permission to assign permissions to a role, which is necessary to perform the assignment operation.
 * - `READ_ROLE`: Permission to read role information, which may be necessary for validation or other operations during permission assignment.
 * - `READ_PERMISSION`: Permission to read permission information, which may be necessary to validate the permissions being assigned to the role.
 *
 * By requiring these permissions, the system ensures that only authorized users can assign permissions to roles and have the necessary access to related information.
 */
export const ASSIGN_PERMISSION_TO_ROLE_ENDPOINT_PERMISSION = [
  READ_PERMISSION,
  READ_ROLE,
  ASSIGN_PERMISSION_TO_ROLE,
] as string[];

/**
 * Permissions required to unassign permissions from a role.
 *
 * This array defines the permissions that are required to access the endpoint for unassigning permissions from a role.
 * It includes the following permissions:
 * - `UNASSIGN_PERMISSION_FROM_ROLE`: Permission to unassign permissions from a role, which is necessary to perform the unassignment operation.
 * - `READ_ROLE`: Permission to read role information, which may be necessary for validation or other operations during permission unassignment.
 * - `READ_PERMISSION`: Permission to read permission information, which may be necessary to validate the permissions being unassigned from the role.
 *
 * By requiring these permissions, the system ensures that only authorized users can unassign permissions from roles and have the necessary access to related information.
 */
export const UNASSIGN_PERMISSION_FROM_ROLE_ENDPOINT_PERMISSION = [
  READ_PERMISSION,
  READ_ROLE,
  UNASSIGN_PERMISSION_FROM_ROLE,
] as string[];

/**
 * Permissions required to read a role along with its assigned permissions.
 *
 * This array defines the permissions that are required to access the endpoint for reading a role along with its assigned permissions.
 * It includes the following permissions:
 * - `READ_ROLE`: Permission to read role information, which is necessary to access the details of the role in the system.
 * - `READ_PERMISSION`: Permission to read permission information, which is necessary to access the details of the permissions assigned to the role.
 *
 * By requiring these permissions, the system ensures that only authorized users can access detailed information about roles and their assigned permissions, maintaining the security of role and permission data.
 */
export const READ_ROLE_WITH_PERMISSIONS_ENDPOINT_PERMISSION = [
  READ_ROLE,
  READ_PERMISSION,
] as string[];

export const ROLE_TO_ASSIGN_PERMISSION_TO_ROLE: SystemRole = {
  name: 'Assign Permission to Role',
  permissions: ASSIGN_PERMISSION_TO_ROLE_ENDPOINT_PERMISSION,
};
export const ROLE_TO_UNASSIGN_PERMISSION_FROM_ROLE: SystemRole = {
  name: 'Unassign Permission from Role',
  permissions: UNASSIGN_PERMISSION_FROM_ROLE_ENDPOINT_PERMISSION,
};
export const ROLE_TO_READ_ROLE_WITH_PERMISSIONS: SystemRole = {
  name: 'Read Role with Permissions',
  permissions: READ_ROLE_WITH_PERMISSIONS_ENDPOINT_PERMISSION,
};
