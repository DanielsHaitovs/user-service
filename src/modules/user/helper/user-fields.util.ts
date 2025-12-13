import { USER_DEPARTMENTS_QUERY_ALIAS } from '@/lib/const/department.const';
import {
  ASSIGNED_BY_USER_QUERY_ALIAS,
  CREATEDBY_USER_QUERY_ALIAS,
  USER_QUERY_ALIAS,
  USER_ROLE_QUERY_ALIAS,
} from '@/lib/const/user.const';
import { User } from '@/user/entities/user.entity';
import { UserDepartments } from '@/user/entities/userDepartments.entity';
import { UserRole } from '@/user/entities/userRoles.entity';

import { getMetadataArgsStorage } from 'typeorm';

/**
 * Dynamically extract all column names from the User entity using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getUserGenericSelectableFields({
  fields,
  alias,
}: {
  fields?: string[] | undefined;
  alias?: string | undefined;
}): string[] {
  const metadata = getMetadataArgsStorage();

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

  return [
    `${alias}.id`,
    `${alias}.createdAt`,
    `${alias}.updatedAt`,
    ...columns.map((column) => `${alias}.${column.propertyName}`),
  ];
}

export function getUserProperties(): string[] {
  const collumns = getMetadataArgsStorage().columns.filter(
    (column) => column.target === User,
  );

  return collumns.map((column) => column.propertyName);
}

export function getUserRoleGenericSelectableFields({
  fields,
  alias,
}: {
  fields?: string[] | undefined;
  alias?: string | undefined;
}): string[] {
  const metadata = getMetadataArgsStorage();

  const columns = metadata.columns.filter(
    (column) => column.target === UserRole,
  );
  alias ??= USER_ROLE_QUERY_ALIAS;

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
      `${alias}.assignedBy`,
    ];
  }

  return [
    `${alias}.id`,
    `${alias}.createdAt`,
    `${alias}.updatedAt`,
    `${alias}.assignedBy`,
    ...columns.map((column) => `${alias}.${column.propertyName}`),
  ];
}

export function getUserDepartmentGenericSelectableFields({
  fields,
  alias,
}: {
  fields?: string[] | undefined;
  alias?: string | undefined;
}): string[] {
  const metadata = getMetadataArgsStorage();

  const columns = metadata.columns.filter(
    (column) => column.target === UserDepartments,
  );
  alias ??= USER_DEPARTMENTS_QUERY_ALIAS;

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
      `${alias}.assignedBy`,
    ];
  }

  return [
    `${alias}.id`,
    `${alias}.createdAt`,
    `${alias}.updatedAt`,
    `${alias}.assignedBy`,
    ...columns.map((column) => `${alias}.${column.propertyName}`),
  ];
}

/**
 * Dynamically extract all column names from the User entity for created by relation using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getCreatedByGenericSelectableFields(
  fields?: string[],
): string[] {
  const metadata = getMetadataArgsStorage();

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

  return [
    `${CREATEDBY_USER_QUERY_ALIAS}.id`,
    `${CREATEDBY_USER_QUERY_ALIAS}.createdAt`,
    `${CREATEDBY_USER_QUERY_ALIAS}.updatedAt`,
    ...columns.map(
      (column) => `${CREATEDBY_USER_QUERY_ALIAS}.${column.propertyName}`,
    ),
  ];
}

/**
 * Dynamically extract all column names from the User entity for assigned by relation using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getAssignedByGenericSelectableFields(
  fields?: string[],
): string[] {
  const metadata = getMetadataArgsStorage();

  const columns = metadata.columns.filter((column) => column.target === User);

  if (fields && fields.length > 0) {
    return [
      ...fields
        .filter((field) =>
          columns.some((column) => column.propertyName === field),
        )
        .flatMap((field) => `${ASSIGNED_BY_USER_QUERY_ALIAS}.${field}`),
      `${ASSIGNED_BY_USER_QUERY_ALIAS}.id`,
      `${ASSIGNED_BY_USER_QUERY_ALIAS}.createdAt`,
      `${ASSIGNED_BY_USER_QUERY_ALIAS}.updatedAt`,
    ];
  }

  return [
    `${ASSIGNED_BY_USER_QUERY_ALIAS}.id`,
    `${ASSIGNED_BY_USER_QUERY_ALIAS}.createdAt`,
    `${ASSIGNED_BY_USER_QUERY_ALIAS}.updatedAt`,
    ...columns.map(
      (column) => `${ASSIGNED_BY_USER_QUERY_ALIAS}.${column.propertyName}`,
    ),
  ];
}
