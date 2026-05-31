import { READ_PERMISSION } from '@/libConst/permission.const';
import type { SystemRole } from '@/system/system-role.interface';

/**
 * Permissions required to Read a new permission.
 *
 * This array defines the permissions that are required to access the endpoint for read permissions.
 * It includes the READ_PERMISSION
 */
export const READ_PERMISSION_ENDPOINT_PERMISSION = [
  READ_PERMISSION,
] as string[];

export const ROLE_TO_READ_PERMISSION: SystemRole = {
  name: 'Read Permission',
  permissions: READ_PERMISSION_ENDPOINT_PERMISSION,
};
