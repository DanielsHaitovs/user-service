/**
 * User-related constants for testing, documentation, and API examples.
 * These values should be used consistently across tests and documentation
 * to maintain uniformity in examples and mock data.
 */

/**
 * Sample UUID v4 for user identification in tests and API documentation.
 * Format follows RFC 4122 standard for universally unique identifiers.
 */
export const EXAMPLE_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

/**
 * Standard example email address used in API documentation and test fixtures.
 * Uses a realistic format that passes email validation.
 */
export const EXAMPLE_USER_EMAIL = 'john.doe@example.com';

/**
 * Standard example first name used in API documentation and test fixtures.
 * Represents a user's first name that is commonly used for testing scenarios.
 */
export const EXAMPLE_USER_FIRST_NAME = 'John';

/**
 * Standard example last name used in API documentation and test fixtures.
 * Represents a user's last name that is commonly used for testing scenarios.
 */
export const EXAMPLE_USER_LAST_NAME = 'Doe';

/**
 * Standard example phone number used in API documentation and test fixtures.
 * Represents a user's phone number that is commonly used for testing scenarios.
 */
export const EXAMPLE_USER_PHONE = '+1234567890';

/**
 * ISO 8601 date format for birth date examples in user profiles.
 * Represents a user born in 1990, commonly used age for testing scenarios.
 */
export const EXAMPLE_USER_DATE_OF_BIRTH = '1990-01-15';

/**
 * Mock token for email verification workflows in tests and documentation.
 * Used to demonstrate email confirmation processes without exposing real tokens.
 */
export const EXAMPLE_USER_EMAIL_VERIFICATION_TOKEN =
  'example-verification-token';

/**
 * Mock token for password reset functionality in tests and examples.
 * Provides consistent token format for password recovery documentation.
 */
// eslint-disable-next-line sonarjs/no-hardcoded-passwords
export const EXAMPLE_USER_PASSWORD_RESET_TOKEN = 'example-reset-token';

/**
 * Alias used in TypeORM queries to refer to the user entity.
 * Ensures consistent naming across query service implementations.
 */
export const USER_QUERY_ALIAS = 'user';

/**
 * Alias used in TypeORM queries to refer to the user role entity.
 * Ensures consistent naming across query service implementations.
 */
export const USER_ROLE_QUERY_ALIAS = 'userRole';

/**
 * Error message used when a user is not found in the database.
 * Provides a clear indication of the issue in API responses.
 */
export const USER_NOT_FOUND_MSG = 'User not found';
/**
 * Error message used when a user is not found in the database.
 * Provides a clear indication of the issue in API responses.
 */
export const EMAIL_EXISTS_MSG = 'User with this email already exists';
