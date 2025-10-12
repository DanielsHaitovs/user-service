/**
 * User-related constants for testing, documentation, and API examples.
 * These values should be used consistently across tests and documentation
 * to maintain uniformity in examples and mock data.
 */

/**
 * Sample UUID v4 for user identification in tests and API documentation.
 * Format follows RFC 4122 standard for universally unique identifiers.
 */
export const EXAMPLE_ROLE_ID = '123e4567-e89b-12d3-a456-426614174000' as string;
/**
 * Sample UUID v4 for permission identification in tests and API documentation.
 * Format follows RFC 4122 standard for universally unique identifiers.
 */
export const EXAMPLE_PERMISSION_ID =
  '123e4567-e89b-12d3-a456-426614174000' as string;
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
 * Standard example name used in API documentation and test fixtures.
 * Represents a permission name that is commonly used for testing scenarios.
 */
export const PERMISSION_QUERY_ALIAS = 'permissions' as string;

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
export const EXAMPLE_PERMISSION_CODE = 'users-view' as string;

/**
 * Standard example description used in API documentation and test fixtures.
 * Represents a permission description that is commonly used for testing scenarios.
 */
export const PERMISSINO_NOT_FOUND_MSG = 'Permission not found' as string;

/**
 * Standard example message used in API documentation and test fixtures.
 * Represents a message indicating that a permission code already exists.
 */
export const PERMISSINO_CODE_EXISTS_MSG =
  'Permissinon with this code already exists' as string;

/**
 * Standard example message used in API documentation and test fixtures.
 */
export const READ_PERMISSION = 'permission:read' as string;
/**
 * Standard example permission used in API documentation and test fixtures.
 */
export const CREATE_PERMISSION = 'permission:create' as string;
/**
 * Standard example permission used in API documentation and test fixtures.
 */
export const UPDATE_PERMISSION = 'permission:update' as string;
/**
 * Standard example permission used in API documentation and test fixtures.
 */
export const DELETE_PERMISSION = 'permission:delete' as string;
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
