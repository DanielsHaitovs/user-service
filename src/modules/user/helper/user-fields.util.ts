import {
  CREATEDBY_USER_QUERY_ALIAS,
  USER_QUERY_ALIAS,
} from '@/lib/const/user.const';
import { User } from '@/user/entities/user.entity';

import { getMetadataArgsStorage } from 'typeorm';

/**
 * Dynamically extract all column names from the User entity using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getUserSelectableFields(fields?: string[]): string[] {
  const metadata = getMetadataArgsStorage();

  // Get all columns for the User entity
  const columns = metadata.columns.filter((column) => column.target === User);

  if (fields && fields.length > 0) {
    return [
      ...fields
        .filter((field) =>
          columns.some((column) => column.propertyName === field),
        )
        .flatMap((field) => `${USER_QUERY_ALIAS}.${field}`),
      `${USER_QUERY_ALIAS}.id`,
      `${USER_QUERY_ALIAS}.createdAt`,
      `${USER_QUERY_ALIAS}.updatedAt`,
    ];
  }

  // Extract column property names
  return [
    `${USER_QUERY_ALIAS}.id`,
    `${USER_QUERY_ALIAS}.createdAt`,
    `${USER_QUERY_ALIAS}.updatedAt`,
    ...columns.map((column) => `${USER_QUERY_ALIAS}.${column.propertyName}`),
  ];
}

/**
 * Dynamically extract all column names from the User entity using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getCreatedBySelectableFields(fields?: string[]): string[] {
  const metadata = getMetadataArgsStorage();

  // Get all columns for the User entity
  const columns = metadata.columns.filter((column) => column.target === User);

  if (fields && fields.length > 0) {
    return [
      ...fields
        .filter((field) =>
          columns.some((column) => column.propertyName === field),
        )
        .flatMap((field) => `${CREATEDBY_USER_QUERY_ALIAS}.${field}`),
      `${CREATEDBY_USER_QUERY_ALIAS}.id`,
      `${CREATEDBY_USER_QUERY_ALIAS}.createdAt`,
      `${CREATEDBY_USER_QUERY_ALIAS}.updatedAt`,
    ];
  }

  // Extract column property names
  return [
    `${CREATEDBY_USER_QUERY_ALIAS}.id`,
    `${CREATEDBY_USER_QUERY_ALIAS}.createdAt`,
    `${CREATEDBY_USER_QUERY_ALIAS}.updatedAt`,
    ...columns.map(
      (column) => `${CREATEDBY_USER_QUERY_ALIAS}.${column.propertyName}`,
    ),
  ];
}
