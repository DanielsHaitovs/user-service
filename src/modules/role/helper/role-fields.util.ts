import { PERMISSION_QUERY_ALIAS } from '@/lib/const/permission.const';
import { ROLE_QUERY_ALIAS } from '@/lib/const/role.const';
import { Permission } from '@/role/entities/permissions.entity';
import { Roles } from '@/role/entities/role.entity';
import { getCreatedByGenericSelectableFields } from '@/user/helper/user-fields.util';

import { getMetadataArgsStorage } from 'typeorm';

/**
 * Dynamically extract all column names from the Roles entity using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getRoleGenericSelectableFields({
  fields,
  alias,
}: {
  fields?: string[] | undefined;
  alias?: string | undefined;
}): string[] {
  const metadata = getMetadataArgsStorage();

  const columns = metadata.columns.filter((column) => column.target === Roles);
  alias ??= ROLE_QUERY_ALIAS;

  if (fields && fields.length > 0) {
    const specified = fields.filter((field) =>
      columns.some((column) => column.propertyName === field),
    );

    specified.push(`${alias}.id`);
    specified.push(`${alias}.createdAt`);
    specified.push(`${alias}.updatedAt`);

    return Array.from(
      new Set([
        `${alias}.id`,
        `${alias}.createdAt`,
        `${alias}.updatedAt`,
        ...specified,
      ]),
    );
  }

  return [
    `${alias}.id`,
    `${alias}.createdAt`,
    `${alias}.updatedAt`,
    ...columns.map((column) => `${alias}.${column.propertyName}`),
  ];
}

/**
 * Dynamically extract all column names from the Permission entity using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getPermissionsGenericSelectableFields({
  fields,
  alias,
}: {
  fields?: string[] | undefined;
  alias?: string | undefined;
}): string[] {
  const metadata = getMetadataArgsStorage();

  const columns = metadata.columns.filter(
    (column) => column.target === Permission,
  );

  alias ??= PERMISSION_QUERY_ALIAS;

  if (fields && fields.length > 0) {
    const specified = fields.filter((field) =>
      columns.some((column) => column.propertyName === field),
    );

    specified.push(`${alias}.id`);
    specified.push(`${alias}.createdAt`);
    specified.push(`${alias}.updatedAt`);

    return Array.from(
      new Set([
        `${alias}.id`,
        `${alias}.createdAt`,
        `${alias}.updatedAt`,
        ...specified,
      ]),
    );
  }

  return [
    `${alias}.id`,
    `${alias}.createdAt`,
    `${alias}.updatedAt`,
    ...columns.map((column) => `${alias}.${column.propertyName}`),
  ];
}

export function getRoleSelectableFields({
  createdByFields,
  roleFields,
  roleAlias,
  permissionFields,
  permissionAlias,
}: {
  roleFields?: string[] | undefined;
  roleAlias?: string | undefined;
  createdByFields?: string[] | undefined;
  permissionFields?: string[] | undefined;
  permissionAlias?: string | undefined;
}): string[] {
  return [
    ...getRoleGenericSelectableFields({ fields: roleFields, alias: roleAlias }),
    ...getPermissionsGenericSelectableFields({
      fields: permissionFields,
      alias: permissionAlias,
    }),
    ...getCreatedByGenericSelectableFields(createdByFields),
  ];
}
