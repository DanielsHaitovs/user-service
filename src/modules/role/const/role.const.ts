import { INPUT_BAD_REQUEST_MSG } from '@/lib/system.const';

/**
 * Sample UUID v4 for user identification in tests and API documentation.
 * Format follows RFC 4122 standard for universally unique identifiers.
 */
export const EXAMPLE_ROLE_ID = '123e4567-e89b-12d3-a456-426614174000' as string;

/**
 * Standard example name used in API documentation and test fixtures.
 * Represents a role name that is commonly used for testing scenarios.
 */
export const ROLE_QUERY_ALIAS = 'roles' as string;

/**
 * Standard example name used in API documentation and test fixtures.
 * Represents a permission name that is commonly used for testing scenarios.
 */
export const EXAMPLE_ROLE_NAME = 'Admin' as string;

/**
 * Standard example description used in API documentation and test fixtures.
 * Represents a role description that is commonly used for testing scenarios.
 */
export const EXAMPLE_ROLE_DESCRIPTION =
  'Administrator role with full access' as string;

export const ROLE_NOT_FOUND_MSG = 'Role not found' as string;

/**
 * Standard example permission used in API documentation and test fixtures.
 * Represents a permission for managing roles.
 */
export const READ_ROLE = 'role:read' as string;

/**
 * Standard example permission used in API documentation and test fixtures.
 * Represents a permission for creating roles.
 */
export const CREATE_ROLE = 'role:create' as string;

/**
 * Standard example permission used in API documentation and test fixtures.
 * Represents a permission for updating roles.
 */
export const UPDATE_ROLE = 'role:update' as string;

/**
 * Standard example permission used in API documentation and test fixtures.
 * Represents a permission for deleting roles.
 */
export const DELETE_ROLE = 'role:delete' as string;

export const CONFLICT_ROLE_NAME_MSG =
  'Role with this name already exists' as string;

export const ROLE_GENERIC_BAD_REQUEST_MSG = [
  'name should not be empty',
  'role name should be a string',
] as string[];

export const ROLE_MIN_OPERATION_BAD_REQUEST_MSG = [
  'Each selectRoleField must be a valid role field',
  'Each selectPermissionField must be a valid permission field',
  'Each selectCreatedByField must be a valid user field',
  'includeCreatedBy must be a boolean value',
  'includeRoles must be a boolean value',
  'includePermissions must be a boolean value',
  'sortField must be a valid user field',
  ...INPUT_BAD_REQUEST_MSG,
];

export const ROLE_API_OK_RESPONSE_MSG = 'Role retrieved successfully';
