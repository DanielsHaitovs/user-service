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
export function getRoleGenerucSelectableFields(fields?: string[]): string[] {
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
    `${ROLE_QUERY_ALIAS}.id`,
    `${ROLE_QUERY_ALIAS}.createdAt`,
    `${ROLE_QUERY_ALIAS}.updatedAt`,
    ...columns.map((column) => `${ROLE_QUERY_ALIAS}.${column.propertyName}`),
  ];
}

/**
 * Dynamically extract all column names from the Permission entity using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getPermissionsGenericSelectableFields(
  fields?: string[],
): string[] {
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
    `${PERMISSION_QUERY_ALIAS}.id`,
    `${PERMISSION_QUERY_ALIAS}.createdAt`,
    `${PERMISSION_QUERY_ALIAS}.updatedAt`,
    ...columns.map(
      (column) => `${PERMISSION_QUERY_ALIAS}.${column.propertyName}`,
    ),
  ];
}

export function getRoleSelectableFields({
  roleFields,
  permissionFields,
}: {
  roleFields?: string[];
  permissionFields?: string[];
}): string[] {
  return [
    ...getRoleGenerucSelectableFields(roleFields),
    ...getPermissionsGenericSelectableFields(permissionFields),
  ];
}
