import {
  CREATE_STORE,
  DELETE_STORE,
  READ_STORE,
  READ_USER_STORE,
  UNASSIGN_USER_STORE,
  UPDATE_STORE,
} from '@/commonConst/store.const';
import type { SystemRole } from '@/system/system-role.interface';

/**
 * Permissions required to update a store.
 *
 * This array defines the permissions that are required to access the endpoint for updating a store.
 * It includes the following permissions:
 * - `UPDATE_STORE`: Permission to update a store, which is necessary to perform the update operation.
 * - `READ_STORE`: Permission to read store information, which may be necessary for validation or other operations during store updates.
 *
 * By requiring these permissions, the system ensures that only authorized users can update stores and have the necessary access to related information.
 */
export const UPDATE_STORE_ENDPOINT_PERMISSION = [
  UPDATE_STORE,
  READ_STORE,
] as string[];

/**
 * Permissions required to delete a store.
 *
 * This array defines the permissions that are required to access the endpoint for deleting a store.
 * It includes the following permissions:
 * - `DELETE_STORE`: Permission to delete a store, which is necessary to perform the delete operation.
 * - `READ_STORE`: Permission to read store information, which may be necessary for validation or other operations during store deletion.
 *
 * By requiring these permissions, the system ensures that only authorized users can delete stores and have the necessary access to related information.
 */
export const DELETE_STORE_ENDPOINT_PERMISSION = [
  DELETE_STORE,
  READ_STORE,
  READ_USER_STORE,
  UNASSIGN_USER_STORE,
] as string[];

/**
 * Permissions required to Create a new store.
 *
 * This array defines the permissions that are required to access the endpoint for creating a store.
 * It includes the following permissions:
 * - `CREATE_STORE`: Permission to create a new store.
 * - `READ_STORE`: Permission to read store information, which may be necessary for validation or other operations during store creation.
 *
 * By requiring these permissions, the system ensures that only authorized users can create new stores and have the necessary access to related information.
 */
export const CREATE_STORE_ENDPOINT_PERMISSION = [
  CREATE_STORE,
  READ_STORE,
] as string[];

/**
 * Permissions required to read store information.
 *
 * This array defines the permissions that are required to access the endpoint for reading store information.
 * It includes the following permission:
 * - `READ_STORE`: Permission to read store information, which is necessary to access the details of the store in the system.
 *
 * By requiring this permission, the system ensures that only authorized users can access detailed information about stores, maintaining the security of store data.
 */
export const READ_STORE_ENDPOINT_PERMISSION = [READ_STORE] as string[];

export const ROLE_TO_CREATE_STORE: SystemRole = {
  name: 'Create Store',
  permissions: CREATE_STORE_ENDPOINT_PERMISSION,
};

export const ROLE_TO_READ_STORE: SystemRole = {
  name: 'Read Store',
  permissions: READ_STORE_ENDPOINT_PERMISSION,
};

export const ROLE_TO_UPDATE_STORE: SystemRole = {
  name: 'Update Store',
  permissions: UPDATE_STORE_ENDPOINT_PERMISSION,
};

export const ROLE_TO_DELETE_STORE: SystemRole = {
  name: 'Delete Store',
  permissions: DELETE_STORE_ENDPOINT_PERMISSION,
};
