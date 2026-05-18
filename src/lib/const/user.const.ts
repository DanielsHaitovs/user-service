/**
 * User-related constants for testing, documentation, and API examples.
 * These values should be used consistently across tests and documentation
 * to maintain uniformity in examples and mock data.
 */

import { COUNTRIES } from '@/libConst/countries.const';
import { INPUT_BAD_REQUEST_MSG } from '@/libConst/system.const';

// Standard email address for the system user.
// This email is used in tests and API documentation to represent the system user.
// It should not be used for real user accounts to avoid conflicts.
export const SYSTEM_USER_EMAIL = 'system@mecService.com' as string;

/**
 * Password for the system user.
 * This password is used in tests and API documentation to represent the system user.
 * It should be a strong password and not used in production environments.
 */

export const SYSTEM_USER_PASSWORD = 'VerySecurePassword!' as string;

/**
 * Standard example name used in API documentation and test fixtures.
 */
export const CREATEDBY_USER_QUERY_ALIAS = 'createdBy' as string;

/**
 * Standard example name used in API documentation and test fixtures.
 */
export const ASSIGNED_BY_USER_QUERY_ALIAS = 'assignedBy' as string;

/**
 * Sample UUID v4 for user identification in tests and API documentation.
 * Format follows RFC 4122 standard for universally unique identifiers.
 */
export const EXAMPLE_USER_ID = '123e4567-e89b-12d3-a456-426614174000' as string;

/**
 * Standard example country used in API documentation and test fixtures.
 * Represents a user's country that is commonly used for testing scenarios.
 */
export const EXAMPLE_USER_COUNTRY = COUNTRIES.US as string;

/**
 * Standard example email address used in API documentation and test fixtures.
 * Uses a realistic format that passes email validation.
 */
export const EXAMPLE_USER_EMAIL = 'john.doe@example.com' as string;

/**
 * Standard example first name used in API documentation and test fixtures.
 * Represents a user's first name that is commonly used for testing scenarios.
 */
export const EXAMPLE_USER_FIRST_NAME = 'John' as string;

/**
 * Standard example last name used in API documentation and test fixtures.
 * Represents a user's last name that is commonly used for testing scenarios.
 */
export const EXAMPLE_USER_LAST_NAME = 'Doe' as string;

/**
 * Standard example phone number used in API documentation and test fixtures.
 * Represents a user's phone number that is commonly used for testing scenarios.
 */
export const EXAMPLE_USER_PHONE = '+1234567890' as string;

/**
 * ISO 8601 date format for birth date examples in user profiles.
 * Represents a user born in 1990, commonly used age for testing scenarios.
 */
export const EXAMPLE_USER_DATE_OF_BIRTH = '1990-01-15' as string;

/**
 * Mock token for email verification workflows in tests and documentation.
 * Used to demonstrate email confirmation processes without exposing real tokens.
 */
export const EXAMPLE_USER_EMAIL_VERIFICATION_TOKEN =
  'example-verification-token' as string;

/**
 * Mock token for password reset functionality in tests and examples.
 * Provides consistent token format for password recovery documentation.
 */

export const EXAMPLE_USER_PASSWORD_RESET_TOKEN =
  'example-reset-token' as string;

/**
 * Alias used in TypeORM queries to refer to the user entity.
 * Ensures consistent naming across query service implementations.
 */
export const USER_QUERY_ALIAS = 'users' as string;

/**
 * Alias used in TypeORM queries to refer to the user role entity.
 * Ensures consistent naming across query service implementations.
 */
export const USER_ROLE_QUERY_ALIAS = 'userRoles' as string;

/**
 * Sample UUID v4 for user identification in tests and API documentation.
 * Format follows RFC 4122 standard for universally unique identifiers.
 */
export const EXAMPLE_USER_ROLE_ID =
  '123e4567-e89b-12d3-a456-426614174134' as string;

/**
 * Error message used when a user is not found in the database.
 * Provides a clear indication of the issue in API responses.
 */
export const USER_NOT_FOUND_MSG = 'User not found' as string;

/**
 * Error message used when a user role is not found in the database.
 * Provides a clear indication of the issue in API responses.
 */
export const USER_ROLE_NOT_FOUND_MSG = 'User role not found' as string;

/**
 * Error message used when a user is not found in the database.
 * Provides a clear indication of the issue in API responses.
 */
export const EMAIL_EXISTS_MSG = 'User with this email already exists' as string;

/**
 * Standard example permission used in API documentation and test fixtures.
 * Represents a permission for creating users.
 */
export const CREATE_USER = 'user:create' as string;

/**
 * Standard example permission used in API documentation and test fixtures.
 * Represents a permission for reading user data.
 */
export const READ_USER = 'user:read' as string;

/**
 * Standard example permission used in API documentation and test fixtures.
 * Represents a permission for updating user data.
 */
export const UPDATE_USER = 'user:update' as string;

/**
 * Standard example permission used in API documentation and test fixtures.
 * Represents a permission for deleting user data.
 */
export const DELETE_USER = 'user:delete' as string;

export const USER_GENERIC_BAD_REQUEST_MSG = [
  'country must be a valid ISO country code',
  'firstName should not be empty',
  'lastName should not be empty',
  'email must be an email',
  'password must be a string',
  'phone must be a valid phone number',
  'dateOfBirth must be a valid ISO 8601 date string',
  'isActive must be a boolean value',
  'isEmailVerified must be a boolean value',
  'passwordResetExpires must be a valid ISO 8601 date string',
  'emailVerificationToken must be a string',
  'passwordResetToken must be a string',
  'createdAt must be a valid ISO 8601 date string',
  'updatedAt must be a valid ISO 8601 date string',
  'isTwoFactorEnabled must be a boolean value',
  'twoFactorSecret must be a string',
];

export const USER_MIN_OPERATION_BAD_REQUEST_MSG = [
  'Each selectUserField must be a valid user field',
  'Each selectUserRoleField must be a valid user role field',
  'Each selectDepartmentField must be a valid department field',
  'Each selectRoleField must be a valid role field',
  'Each selectPermissionField must be a valid permission field',
  'Each selectCreatedByField must be a valid user field',
  'includeCreatedBy must be a boolean value',
  'includeDepartments must be a boolean value',
  'includeRoles must be a boolean value',
  'includePermissions must be a boolean value',
  'sortField must be a valid user field',
  ...INPUT_BAD_REQUEST_MSG,
];

export const USER_FULL_BAD_REQUEST_MSG = [
  'Each id must be a valid UUIDv4',
  'Each firstName must be a string',
  'Each lastName must be a string',
  'Each email must be an email',
  'Each phoneNumber must be a string',
  'isActive must be a boolean value',
  'isEmailVerified must be a boolean value',
  'Each createdById must be a valid UUIDv4',
  'Each departmentId must be a valid UUIDv4',
  'Each departmentCountry must be a valid enum value',
  'Each roleId must be a valid UUIDv4',
  'Each roleName must be a string',
  'Each permissionId must be a valid UUIDv4',
  'Each permissionCode must be a string',
  'dateFilterParam must be a valid user date field',
  'dateFrom must be a valid ISO 8601 date string',
  'dateTo must be a valid ISO 8601 date string',
  ...USER_MIN_OPERATION_BAD_REQUEST_MSG,
] as string[];

export const USER_API_OK_RESPONSE_MSG = 'User retrieved successfully';

export const USER_UPDATE_API_OK_LIST = {
  permissions: [UPDATE_USER, READ_USER],
  // body: {
  //   type: UpdateUserDto,
  //   description: 'User update data (partial)',
  // },
  // badRequestMessages: {
  //   examples: USER_GENERIC_BAD_REQUEST_MSG,
  // },
  // okOperation: {
  //   description: 'User updated successfully',
  //   type: UserResponseDto,
  //   isArray: false,
  // },
  conflictMessage: {
    description: 'Email already exists (when updating email)',
  },
};
