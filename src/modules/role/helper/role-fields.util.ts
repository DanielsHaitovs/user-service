import {
  PERMISSION_QUERY_ALIAS,
  ROLE_QUERY_ALIAS,
} from '@/lib/const/role.const';
import { Permission } from '@/role/entities/permissions.entity';
import { Role } from '@/role/entities/role.entity';

import { getMetadataArgsStorage } from 'typeorm';

/**
 * Dynamically extract all column names from the Role entity using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getRoleSelectableFields(fields?: string[]): string[] {
  const metadata = getMetadataArgsStorage();

  // Get all columns for the User entity
  const columns = metadata.columns.filter((column) => column.target === Role);

  if (fields && fields.length > 0) {
    return fields.filter((field) =>
      columns.some((column) => column.propertyName === field),
    );
  }

  // Extract column property names
  return [
    'id',
    'createdAt',
    'updatedAt',
    ...columns.map((column) => column.propertyName),
  ];
}

/**
 * Dynamically extract all column names from the Permission entity using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getPermissionsSelectableFields(fields?: string[]): string[] {
  const metadata = getMetadataArgsStorage();

  // Get all columns for the User entity
  const columns = metadata.columns.filter(
    (column) => column.target === Permission,
  );

  if (fields && fields.length > 0) {
    return fields.filter((field) =>
      columns.some((column) => column.propertyName === field),
    );
  }

  // Extract column property names
  return [
    'id',
    'createdAt',
    'updatedAt',
    ...columns.map((column) => column.propertyName),
  ];
}

export function getRoleSortableFields(): string[] {
  return getRoleSelectableFields().flatMap((field) => {
    return `${ROLE_QUERY_ALIAS}.${field}`;
  });
}

export function getPermissionsSortableFields(): string[] {
  return getPermissionsSelectableFields().flatMap((field) => {
    return `${PERMISSION_QUERY_ALIAS}.${field}`;
  });
}
