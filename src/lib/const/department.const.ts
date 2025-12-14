/**
 * Department-related constants for testing, documentation, and API examples.
 * These values should be used consistently across tests and documentation
 * to maintain uniformity in examples and mock data.
 */

import { DepartmentListResponseDto } from '@/departmentDto/department.dto';
import { INPUT_BAD_REQUEST_MSG } from '@/libConst/system.const';
// import { INPUT_BAD_REQUEST_MSG } from '@/lib/system.const';

/**
 * Sample UUID v4 for department identification in tests and API documentation.
 * Format follows RFC 4122 standard for universally unique identifiers.
 */
export const EXAMPLE_DEPARTMENT_ID =
  '123e4567-e89b-12d3-a456-426614174000' as string;

/**
 * Standard example name used in API documentation and test fixtures.
 * Represents a department name that is commonly used for testing scenarios.
 */
export const EXAMPLE_DEPARTMENT_NAME = 'Finance Department' as string;

/**
 * Standard example country used in API documentation and test fixtures.
 * Represents a department's country that is commonly used for testing scenarios.
 */
export const EXAMPLE_DEPARTMENT_COUNTRY = 'United States' as string;

/**
 * Standard example name used in API documentation and test fixtures.
 * Represents a department name that is commonly used for testing scenarios.
 */
export const DEPARTMENT_QUERY_ALIAS = 'departments' as string;

export const USER_DEPARTMENTS_QUERY_ALIAS = 'userDepartments' as string;

/**
 * Standard example message used in API documentation and test fixtures.
 * Represents a department not found message that is commonly used for testing scenarios.
 */
export const DEPARTMENT_NOT_FOUND_MSG = 'Department not found' as string;

/**
 * Standard example message used in API documentation and test fixtures.
 * Represents a department name exists message that is commonly used for testing scenarios.
 */
export const DEPARTMENT_NAME_EXISTS_MSG =
  'Department with this name already exists' as string;

/**
 * Standard example description used in API documentation and test fixtures.
 * Represents a department description that is commonly used for testing scenarios.
 */
export const READ_DEPARTMENT = 'department:read' as string;

/**
 * Standard example description used in API documentation and test fixtures.
 * Represents a department description that is commonly used for testing scenarios.
 */
export const CREATE_DEPARTMENT = 'department:create' as string;

/**
 * Standard example description used in API documentation and test fixtures.
 * Represents a department description that is commonly used for testing scenarios.
 */
export const UPDATE_DEPARTMENT = 'department:update' as string;

/**
 * Standard example description used in API documentation and test fixtures.
 * Represents a department description that is commonly used for testing scenarios.
 */
export const DELETE_DEPARTMENT = 'department:delete' as string;

export const READ_USER_DEPARTMENT = 'user-department:read' as string;

export const CREATE_USER_DEPARTMENT = 'user-department:create' as string;

export const UPDATE_USER_DEPARTMENT = 'user-department:update' as string;

export const DELETE_USER_DEPARTMENT = 'user-department:delete' as string;

export const ASSIGN_USER_DEPARTMENT = 'user-department:assign' as string;

export const DEPARTMENT_API_OK_RESPONSE_MSG =
  'Department retrieved successfully';

export const DEPARTMENT_GENERIC_BAD_REQUEST_MSG = [
  'country must be a valid ISO country code',
  'name should not be empty',
];

export const DEPARTMENT_MIN_OPERATION_BAD_REQUEST_MSG = [
  'Each selectUserField must be a valid user field',
  'Each selectDepartmentField must be a valid department field',
  'includeCreatedBy must be a boolean value',
  'includeDepartments must be a boolean value',
  'includeUsers must be a boolean value',
  'sortField must be a valid department field',
  ...INPUT_BAD_REQUEST_MSG,
];

export const DEPARTMENT_FULL_OPERATION_BAD_REQUEST_MSG = [
  'Each id must be a valid UUIDv4',
  'Each name must be a string',
  'Each country must be a valid ISO country code',
  'eachUserId must be a valid UUIDv4',
  'createdAt must be a valid ISO 8601 date string',
  'updatedAt must be a valid ISO 8601 date string',
  'each createdById must be a valid UUIDv4',
  ...DEPARTMENT_MIN_OPERATION_BAD_REQUEST_MSG,
];

export const DEPARTMENT_MIN_API_OK_LIST = {
  badRequestMessages: {
    examples: DEPARTMENT_MIN_OPERATION_BAD_REQUEST_MSG,
  },
  okOperation: {
    description: DEPARTMENT_API_OK_RESPONSE_MSG,
    type: DepartmentListResponseDto,
    isArray: false,
  },
};
