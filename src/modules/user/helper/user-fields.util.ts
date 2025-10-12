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
export function getUserSelectableFields({
  fields,
  alias,
}: {
  fields?: string[] | undefined;
  alias?: string | undefined;
}): string[] {
  const metadata = getMetadataArgsStorage();

  // Get all columns for the User entity
  const columns = metadata.columns.filter((column) => column.target === User);
  alias ??= USER_QUERY_ALIAS;

  if (fields && fields.length > 0) {
    return [
      ...fields
        .filter((field) =>
          columns.some((column) => column.propertyName === field),
        )
        .flatMap((field) => `${alias}.${field}`),
      `${alias}.id`,
      `${alias}.createdAt`,
      `${alias}.updatedAt`,
    ];
  }

  // Extract column property names
  return [
    `${alias}.id`,
    `${alias}.createdAt`,
    `${alias}.updatedAt`,
    ...columns.map((column) => `${alias}.${column.propertyName}`),
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
