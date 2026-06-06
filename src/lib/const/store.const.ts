/**
 * STORE-related constants for testing, documentation, and API examples.
 * These values should be used consistently across tests and documentation
 * to maintain uniformity in examples and mock data.
 */

import { INPUT_BAD_REQUEST_MSG } from '@/libConst/system.const';

/**
 * Sample UUID v4 for STORE identification in tests and API documentation.
 * Format follows RFC 4122 standard for universally unique identifiers.
 */
export const EXAMPLE_STORE_ID =
  '123e4567-e89b-12d3-a456-426614174000' as string;

/**
 * Standard example name used in API documentation and test fixtures.
 * Represents a STORE name that is commonly used for testing scenarios.
 */
export const EXAMPLE_STORE_NAME = 'German Shoe STORE' as string;

/**
 * Standard example code used in API documentation and test fixtures.
 * Represents a STORE code that is commonly used for testing scenarios.
 */
export const EXAMPLE_STORE_CODE = 'store_de' as string;

/**
 * Standard example view code used in API documentation and test fixtures.
 * Represents a STORE view code that is commonly used for testing scenarios.
 */
export const EXAMPLE_STORE_VIEW_CODE = 'de_de' as string;

/**
 * Standard example name used in API documentation and test fixtures.
 * Represents a STORE name that is commonly used for testing scenarios.
 */
export const STORE_QUERY_ALIAS = 'stores';

export const USER_STORES_QUERY_ALIAS = 'userStores';

/**
 * Standard example message used in API documentation and test fixtures.
 * Represents a STORE not found message that is commonly used for testing scenarios.
 */
export const STORE_NOT_FOUND_MSG = 'STORE not found' as string;

/**
 * Standard example message used in API documentation and test fixtures.
 * Represents a STORE name exists message that is commonly used for testing scenarios.
 */
export const STORE_NAME_EXISTS_MSG =
  'STORE with this name already exists' as string;

export const READ_STORE = 'store:read' as string;

export const CREATE_STORE = 'store:create' as string;

export const UPDATE_STORE = 'store:update' as string;

export const DELETE_STORE = 'store:delete' as string;

export const READ_USER_STORE = 'user-store:read' as string;

export const ASSIGN_USER_STORE = 'user-store:assign' as string;

export const UNASSIGN_USER_STORE = 'user-store:unassign' as string;

export const CONFLICT_STORE_NAME_MSG = 'A STORE already exists' as string;

export const STORE_API_OK_RESPONSE_MSG = 'STORE retrieved successfully';

export const STORE_GENERIC_BAD_REQUEST_MSG = [
  'name should not be empty',
  'name must be a string',
  'code should not be empty',
  'code must be a string',
  'viewCode should not be empty',
  'viewCode must be a string',
];

export const STORE_MIN_OPERATION_BAD_REQUEST_MSG = [
  'Each selectUserField must be a valid user field',
  'Each selectSTOREField must be a valid STORE field',
  'includeCreatedBy must be a boolean value',
  'includeSTOREs must be a boolean value',
  'includeUsers must be a boolean value',
  'sortField must be a valid STORE field',
  ...INPUT_BAD_REQUEST_MSG,
];

export const STORE_FULL_OPERATION_BAD_REQUEST_MSG = [
  'Each id must be a valid UUIDv4',
  'Each name must be a string',
  'Each country must be a valid ISO country code',
  'eachUserId must be a valid UUIDv4',
  'createdAt must be a valid ISO 8601 date string',
  'updatedAt must be a valid ISO 8601 date string',
  'each createdById must be a valid UUIDv4',
  ...STORE_MIN_OPERATION_BAD_REQUEST_MSG,
];

// export const STORE_MIN_API_OK_LIST = {
//   badRequestMessages: {
//     examples: STORE_MIN_OPERATION_BAD_REQUEST_MSG,
//   },
//   okOperation: {
//     description: STORE_API_OK_RESPONSE_MSG,
//     type: STOREListResponseDto,
//     isArray: false,
//   },
// };
