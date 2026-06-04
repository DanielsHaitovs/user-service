import { INPUT_BAD_REQUEST_MSG } from '@/libConst/system.const';
import { READ_USER } from '@/libConst/user.const';

/**
 * Sample UUID v4 for permission identification in tests and API documentation.
 * Format follows RFC 4122 standard for universally unique identifiers.
 */
export const EXAMPLE_PERMISSION_ID =
  '123e4567-e89b-12d3-a456-426614174000' as string;

/**
 * Standard example name used in API documentation and test fixtures.
 * Represents a permission name that is commonly used for testing scenarios.
 */
export const PERMISSION_QUERY_ALIAS = 'permissions';

/**
 * Standard example name used in API documentation and test fixtures.
 * Represents a permission name that is commonly used for testing scenarios.
 */
export const EXAMPLE_PERMISSION_NAME = 'View Users' as string;

/**
 * Standard example code used in API documentation and test fixtures.
 * Represents a permission code that is commonly used for testing scenarios.
 */
export const ROOT_ADMIN_PERMISSION = 'root_admin' as string;

/**
 * Standard example code used in API documentation and test fixtures.
 * Represents a permission code that is commonly used for testing scenarios.
 */
export const EXAMPLE_PERMISSION_CODE = READ_USER;

/**
 * Standard example description used in API documentation and test fixtures.
 * Represents a permission description that is commonly used for testing scenarios.
 */
export const PERMISSION_NOT_FOUND_MSG = 'Permission not found' as string;

/**
 * Standard example message used in API documentation and test fixtures.
 * Represents a message indicating that a permission code already exists.
 */
export const PERMISSION_CODE_EXISTS_MSG =
  'Permissinon with this code already exists' as string;

/**
 * Permission to read role permissions
 */
export const READ_PERMISSION = 'permission:read' as string;

export const PERMISSION_GENERIC_BAD_REQUEST_MSG = [
  'country must be a valid ISO country code',
  'name should not be empty and must be a string',
  'Each roleId must be a valid UUIDv4',
];

export const PERMISSION_MIN_OPERATION_BAD_REQUEST_MSG = [
  'Each selectRoleField must be a valid role field',
  'Each selectPermissionField must be a valid permission field',
  'Each selectCreatedByField must be a valid user field',
  'includeCreatedBy must be a boolean value',
  'includeRoles must be a boolean value',
  'includePermissions must be a boolean value',
  'sortField must be a valid user field',
  ...INPUT_BAD_REQUEST_MSG,
];

export const PERMISSION_API_OK_RESPONSE_MSG =
  'Permission retrieved successfully';
