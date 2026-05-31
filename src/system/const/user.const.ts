import {
  ASSIGN_USER_DEPARTMENT,
  READ_DEPARTMENT,
  READ_USER_DEPARTMENT,
  UNASSIGN_USER_DEPARTMENT,
} from '@/libConst/department.const';
import { READ_PERMISSION } from '@/libConst/permission.const';
import {
  ASSIGN_USER_ROLE,
  READ_ROLE,
  READ_USER_ROLE,
  UNASSIGN_USER_ROLE,
} from '@/libConst/role.const';
import {
  ASSIGN_USER_STORE,
  READ_STORE,
  READ_USER_STORE,
  UNASSIGN_USER_STORE,
} from '@/libConst/store.const';
import {
  CREATE_USER,
  DELETE_USER,
  READ_USER,
  UPDATE_USER,
} from '@/libConst/user.const';
import type { SystemRole } from '@/system/system-role.interface';

/**
 * Permissions required to read user-department relationships.
 *
 * This array defines the permissions that are required to access the endpoint for reading user-department relationships.
 * It includes the following permissions:
 * - `READ_USER_DEPARTMENT`: Permission to read user-department relationships, which is necessary to perform the read operation.
 * - `READ_USER`: Permission to read user information, which may be necessary for validation or other operations during reading user-department relationships.
 * - `READ_DEPARTMENT`: Permission to read department information, which may be necessary for validation or other operations during reading user-department relationships.
 *
 * By requiring these permissions, the system ensures that only authorized users can access user-department relationship information and have the necessary access to related information during this operation.
 */
export const READ_USER_DEPARTMENT_ENDPOINT_PERMISSION = [
  READ_USER_DEPARTMENT,
  READ_USER,
  READ_DEPARTMENT,
] as string[];

/**
 * Permissions required to assign a department to a user.
 *
 * This array defines the permissions that are required to access the endpoint for assigning a department to a user.
 * It includes the following permissions:
 * - `ASSIGN_USER_DEPARTMENT`: Permission to assign a department to a user, which is necessary to perform the assignment operation.
 * - `READ_USER_DEPARTMENT`: Permission to read user-department relationships, which may be necessary for validation or other operations during department assignment.
 * - `READ_USER`: Permission to read user information, which may be necessary for validation or other operations during department assignment.
 * - `READ_DEPARTMENT`: Permission to read department information, which may be necessary for validation or other operations during department assignment.
 *
 * By requiring these permissions, the system ensures that only authorized users can assign departments to users and have the necessary access to related information during this operation.
 */
export const ASSIGN_DEPARTMENT_TO_USER_ENDPOINT_PERMISSION = [
  READ_DEPARTMENT,
  READ_USER,
  READ_USER_DEPARTMENT,
  ASSIGN_USER_DEPARTMENT,
] as string[];

/**
 * Permissions required to unassign a department from a user.
 *
 * This array defines the permissions that are required to access the endpoint for unassigning a department from a user.
 * It includes the following permissions:
 * - `UNASSIGN_USER_DEPARTMENT`: Permission to unassign a department from a user, which is necessary to perform the unassignment operation.
 * - `READ_USER_DEPARTMENT`: Permission to read user-department relationships, which may be necessary for validation or other operations during department unassignment.
 * - `READ_USER`: Permission to read user information, which may be necessary for validation or other operations during department unassignment.
 * - `READ_DEPARTMENT`: Permission to read department information, which may be necessary for validation or other operations during department unassignment.
 *
 * By requiring these permissions, the system ensures that only authorized users can unassign departments from users and have the necessary access to related information during this operation.
 */
export const UNASSIGN_DEPARTMENT_TO_USER_ENDPOINT_PERMISSION = [
  READ_DEPARTMENT,
  READ_USER,
  READ_USER_DEPARTMENT,
  UNASSIGN_USER_DEPARTMENT,
] as string[];

export const ROLE_TO_READ_USER_DEPARTMENT: SystemRole = {
  name: 'Read User Department',
  permissions: READ_USER_DEPARTMENT_ENDPOINT_PERMISSION,
};

export const ROLE_TO_ASSIGN_DEPARTMENT_TO_USER: SystemRole = {
  name: 'Assign Department to User',
  permissions: ASSIGN_DEPARTMENT_TO_USER_ENDPOINT_PERMISSION,
};

export const ROLE_TO_UNASSIGN_DEPARTMENT_TO_USER: SystemRole = {
  name: 'Unassign Department to User',
  permissions: UNASSIGN_DEPARTMENT_TO_USER_ENDPOINT_PERMISSION,
};

// STORE

/**
 * Permissions required to unassign a store from a user.
 *
 * This array defines the permissions that are required to access the endpoint for unassigning a store from a user.
 * It includes the following permissions:
 * - `UNASSIGN_USER_STORE`: Permission to unassign a store from a user, which is necessary to perform the unassignment operation.
 * - `READ_USER_STORE`: Permission to read user-store relationships, which may be necessary for validation or other operations during store unassignment.
 * - `READ_USER`: Permission to read user information, which may be necessary for validation or other operations during store unassignment.
 * - `READ_STORE`: Permission to read store information, which may be necessary for validation or other operations during store unassignment.
 *
 * By requiring these permissions, the system ensures that only authorized users can unassign stores from users and have the necessary access to related information during this operation.
 */
export const UNASSIGN_USER_STORE_ENDPOINT_PERMISSION = [
  READ_USER,
  READ_STORE,
  READ_USER_STORE,
  UNASSIGN_USER_STORE,
] as string[];

/** * Permissions required to assign a store to a user.
 *
 * This array defines the permissions that are required to access the endpoint for assigning a store to a user.
 * It includes the following permissions:
 * - `ASSIGN_USER_STORE`: Permission to assign a store to a user, which is necessary to perform the assignment operation.
 * - `READ_USER_STORE`: Permission to read user-store relationships, which may be necessary for validation or other operations during store assignment.
 * - `READ_USER`: Permission to read user information, which may be necessary for validation or other operations during store assignment.
 * - `READ_STORE`: Permission to read store information, which may be necessary for validation or other operations during store assignment.
 *
 * By requiring these permissions, the system ensures that only authorized users can assign stores to users and have the necessary access to related information during this operation.
 */
export const ASSIGN_USER_STORE_ENDPOINT_PERMISSION = [
  READ_USER,
  READ_STORE,
  READ_USER_STORE,
  ASSIGN_USER_STORE,
] as string[];

/**
 * Permissions required to read user-store relationships.
 *
 * This array defines the permissions that are required to access the endpoint for reading user-store relationships.
 * It includes the following permissions:
 * - `READ_USER_STORE`: Permission to read user-store relationships, which is necessary to perform the read operation.
 * - `READ_USER`: Permission to read user information, which may be necessary for validation or other operations during reading user-store relationships.
 * - `READ_STORE`: Permission to read store information, which may be necessary for validation or other operations during reading user-store relationships.
 *
 * By requiring these permissions, the system ensures that only authorized users can access user-store relationship information and have the necessary access to related information during this operation.
 */
export const READ_USER_STORE_ENDPOINT_PERMISSION = [
  READ_USER_STORE,
  READ_STORE,
  READ_USER,
] as string[];

export const ROLE_TO_ASSIGN_USER_STORE: SystemRole = {
  name: 'Assign User',
  permissions: ASSIGN_USER_STORE_ENDPOINT_PERMISSION,
};
export const ROLE_TO_UNASSIGN_USER_STORE: SystemRole = {
  name: 'Unassign User',
  permissions: UNASSIGN_USER_STORE_ENDPOINT_PERMISSION,
};
export const ROLE_TO_READ_USER_STORE: SystemRole = {
  name: 'Read User Store',
  permissions: READ_USER_STORE_ENDPOINT_PERMISSION,
};

/**
 * Permissions required to assign a role to a user.
 *
 * This array defines the permissions that are required to access the endpoint for assigning a role to a user.
 * It includes the following permissions:
 * - `ASSIGN_USER_ROLE`: Permission to assign a role to a user, which is necessary to perform the assignment operation.
 * - `READ_USER_ROLE`: Permission to read user-role relationships, which may be necessary for validation or other operations during role assignment.
 * - `READ_USER`: Permission to read user information, which may be necessary for validation or other operations during role assignment.
 * - `READ_ROLE`: Permission to read role information, which may be necessary for validation or other operations during role assignment.
 *
 * By requiring these permissions, the system ensures that only authorized users can assign roles to users and have the necessary access to related information during this operation.
 */
export const ASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION = [
  READ_USER,
  READ_ROLE,
  READ_USER_ROLE,
  ASSIGN_USER_ROLE,
] as string[];

/**
 * Permissions required to unassign a role from a user.
 * This array defines the permissions that are required to access the endpoint for unassigning a role from a user.
 * It includes the following permissions:
 * - `UNASSIGN_USER_ROLE`: Permission to unassign a role from a user, which is necessary to perform the unassignment operation.
 * - `READ_USER_ROLE`: Permission to read user-role relationships, which may be necessary for validation or other operations during role unassignment.
 * - `READ_USER`: Permission to read user information, which may be necessary for validation or other operations during role unassignment.
 * - `READ_ROLE`: Permission to read role information, which may be necessary for validation or other operations during role unassignment.
 *
 * By requiring these permissions, the system ensures that only authorized users can unassign roles from users and have the necessary access to related information during this operation.
 */
export const UNASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION = [
  READ_USER,
  READ_ROLE,
  READ_USER_ROLE,
  UNASSIGN_USER_ROLE,
] as string[];

/**
 * Permissions required to read user-role relationships.
 *
 * This array defines the permissions that are required to access the endpoint for reading user-role relationships.
 * It includes the following permissions:
 * - `READ_USER_ROLE`: Permission to read user-role relationships, which is necessary to perform the read operation.
 * - `READ_USER`: Permission to read user information, which may be necessary for validation or other operations during reading user-role relationships.
 * - `READ_ROLE`: Permission to read role information, which may be necessary for validation or other operations during reading user-role relationships.
 *
 * By requiring these permissions, the system ensures that only authorized users can access user-role relationship information and have the necessary access to related information during this operation.
 */
export const READ_USER_ROLE_ENDPOINT_PERMISSION = [
  READ_USER_ROLE,
  READ_ROLE,
  READ_USER,
] as string[];

/**
 * Permissions required to read user permissions.
 * This array defines the permissions that are required to access the endpoint for reading user permissions.
 * It includes the following permissions:
 * - `READ_USER_ROLE`: Permission to read user-role relationships, which may be necessary for validation or other operations during reading user permissions.
 * - `READ_ROLE`: Permission to read role information, which may be necessary for validation or other operations during reading user permissions.
 * - `READ_PERMISSION`: Permission to read permission information, which may be necessary for validation or other operations during reading user permissions.
 * - `READ_USER`: Permission to read user information, which may be necessary for validation or other operations during reading user permissions.
 *
 * By requiring these permissions, the system ensures that only authorized users can access user permission information and have the necessary access to related information during this operation.
 */
export const READ_USER_PERMISSIONS_ENDPOINT_PERMISSION = [
  READ_USER_ROLE,
  READ_ROLE,
  READ_PERMISSION,
  READ_USER,
] as string[];

export const ROLE_TO_ASSIGN_ROLE_TO_USER: SystemRole = {
  name: 'Assign Role to User',
  permissions: ASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
};

export const ROLE_TO_UNASSIGN_ROLE_FROM_USER: SystemRole = {
  name: 'Unassign Role from User',
  permissions: UNASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
};

export const ROLE_TO_READ_USER_ROLE: SystemRole = {
  name: 'Read User Role',
  permissions: READ_USER_ROLE_ENDPOINT_PERMISSION,
};

export const ROLE_TO_READ_USER_PERMISSIONS: SystemRole = {
  name: 'Read User Permissions',
  permissions: READ_USER_PERMISSIONS_ENDPOINT_PERMISSION,
};

/**
 * Permissions required to update a user.
 *
 * This array defines the permissions that are required to access the endpoint for updating a user.
 * It includes the following permissions:
 * - `UPDATE_USER`: Permission to update a user, which is necessary to perform the update operation.
 * - `READ_USER`: Permission to read user information, which may be necessary for validation or other operations during user updates.
 *
 * By requiring these permissions, the system ensures that only authorized users can update users and have the necessary access to related information.
 */
export const UPDATE_USER_ENDPOINT_PERMISSION = [
  UPDATE_USER,
  READ_USER,
] as string[];

/**
 * Permissions required to delete a user.
 *
 * This array defines the permissions that are required to access the endpoint for deleting a user.
 * It includes the following permissions:
 * - `DELETE_USER`: Permission to delete a user, which is necessary to perform the delete operation.
 * - `READ_USER`: Permission to read user information, which may be necessary for validation or other operations during user deletion.
 *
 * By requiring these permissions, the system ensures that only authorized users can delete users and have the necessary access to related information.
 */
export const DELETE_USER_ENDPOINT_PERMISSION = [
  DELETE_USER,
  READ_USER,
  ...UNASSIGN_ROLE_TO_USER_ENDPOINT_PERMISSION,
  ...UNASSIGN_USER_STORE_ENDPOINT_PERMISSION,
  ...UNASSIGN_DEPARTMENT_TO_USER_ENDPOINT_PERMISSION,
] as string[];

/**
 * Permissions required to create a user.
 *
 * This array defines the permissions that are required to access the endpoint for creating a user.
 * It includes the following permissions:
 * - `CREATE_USER`: Permission to create a user, which is necessary to perform the create operation.
 * - `READ_USER`: Permission to read user information, which may be necessary for validation or other operations during user creation.
 * - `READ_DEPARTMENT`: Permission to read department information, which may be necessary for assigning a department to the new user.
 * - `ASSIGN_USER_DEPARTMENT`: Permission to assign a department to a user, which may be necessary for setting up the new user's department.
 * - `READ_USER_DEPARTMENT`: Permission to read user-department relationships, which may be necessary for validation or other operations during user creation.
 * - `READ_ROLE`: Permission to read role information, which may be necessary for assigning roles to the new user.
 * - `ASSIGN_USER_ROLE`: Permission to assign roles to a user, which may be necessary for setting up the new user's roles.
 * - `READ_USER_ROLE`: Permission to read user-role relationships, which may be necessary for validation or other operations during user creation.
 * - `READ_STORE`: Permission to read store information, which may be necessary for assigning a store to the new user.
 * - `READ_USER_STORE`: Permission to read user-store relationships, which may be necessary for validation or other operations during user creation.
 * - `ASSIGN_USER_STORE`: Permission to assign a store to a user, which may be necessary for setting up the new user's store.
 *
 * By requiring these permissions, the system ensures that only authorized users can create users and have the necessary access to related information and operations during user creation.
 */
export const CREATE_USER_ENDPOINT_PERMISSION = [
  CREATE_USER,
  READ_USER,
  READ_DEPARTMENT,
  ASSIGN_USER_DEPARTMENT,
  READ_USER_DEPARTMENT,
  READ_ROLE,
  ASSIGN_USER_ROLE,
  READ_USER_ROLE,
  READ_STORE,
  READ_USER_STORE,
  ASSIGN_USER_STORE,
] as string[];

/**
 * Permissions required to read user information.
 *
 * This array defines the permissions that are required to access the endpoint for reading user information.
 * It includes the following permission:
 * - `READ_USER`: Permission to read user information, which is necessary to perform the read operation.
 *
 * By requiring this permission, the system ensures that only authorized users can access user information.
 */
export const READ_USER_ENDPOINT_PERMISSION = [READ_USER] as string[];

export const ROLE_TO_CREATE_USER: SystemRole = {
  name: 'Create User',
  permissions: CREATE_USER_ENDPOINT_PERMISSION,
};
export const ROLE_TO_READ_USER: SystemRole = {
  name: 'Read User',
  permissions: READ_USER_ENDPOINT_PERMISSION,
};
export const ROLE_TO_UPDATE_USER: SystemRole = {
  name: 'Update User',
  permissions: UPDATE_USER_ENDPOINT_PERMISSION,
};
export const ROLE_TO_DELETE_USER: SystemRole = {
  name: 'Delete User',
  permissions: DELETE_USER_ENDPOINT_PERMISSION,
};
