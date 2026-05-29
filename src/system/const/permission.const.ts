import {
  CREATE_PERMISSION,
  DELETE_PERMISSION,
  READ_PERMISSION,
  UPDATE_PERMISSION,
} from '@/libConst/permission.const';
import { READ_ROLE } from '@/libConst/role.const';
import type { SystemRole } from '@/system/system-role.interface';

/**
 * Permissions required to Update a new permission.
 *
 * This array defines the permissions that are required to access the endpoint for updating permissions.
 * It includes the UPDATE_PERMISSION permission, as well as the READ_PERMISSION
 */
export const UPDATE_PERMISSION_ENDPOINT_PERMISSION = [
  UPDATE_PERMISSION,
  READ_PERMISSION,
] as string[];

/**
 * Permissions required to Delete a new permission.
 *
 * This array defines the permissions that are required to access the endpoint for deleting permissions.
 * It includes the DELETE_PERMISSION permission, as well as the READ_PERMISSION
 */
export const DELETE_PERMISSION_ENDPOINT_PERMISSION = [
  DELETE_PERMISSION,
  READ_PERMISSION,
] as string[];

/**
 * Permissions required to create a new permission.
 *
 * This array defines the permissions that are required to access the endpoint for creating a new permission.
 * It includes the CREATE_PERMISSION permission, as well as the READ_PERMISSION and READ_ROLE permissions
 */
export const CREATE_PERMISSION_ENDPOINT_PERMISSION = [
  CREATE_PERMISSION,
  READ_PERMISSION,
  READ_ROLE,
] as string[];

/**
 * Permissions required to Read a new permission.
 *
 * This array defines the permissions that are required to access the endpoint for read permissions.
 * It includes the READ_PERMISSION
 */
export const READ_PERMISSION_ENDPOINT_PERMISSION = [
  READ_PERMISSION,
] as string[];

export const ROLE_TO_CREATE_PERMISSION: SystemRole = {
  name: 'Create Permission',
  permissions: CREATE_PERMISSION_ENDPOINT_PERMISSION,
};
export const ROLE_TO_READ_PERMISSION: SystemRole = {
  name: 'Read Permission',
  permissions: READ_PERMISSION_ENDPOINT_PERMISSION,
};
export const ROLE_TO_UPDATE_PERMISSION: SystemRole = {
  name: 'Update Permission',
  permissions: UPDATE_PERMISSION_ENDPOINT_PERMISSION,
};
export const ROLE_TO_DELETE_PERMISSION: SystemRole = {
  name: 'Delete Permission',
  permissions: DELETE_PERMISSION_ENDPOINT_PERMISSION,
};
