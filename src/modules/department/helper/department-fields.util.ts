import { Departments } from '@/department/entities/department.entity';
import { DEPARTMENT_QUERY_ALIAS } from '@/lib/const/department.const';
import {
  getCreatedByGenericSelectableFields,
  getUserGenericSelectableFields,
} from '@/user/helper/user-fields.util';

import { getMetadataArgsStorage } from 'typeorm';

/**
 * Dynamically extract all column names from the Departments entity using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getDepartmentGenericSelectableFields({
  fields,
  alias,
}: {
  fields?: string[] | undefined;
  alias?: string | undefined;
}): string[] {
  const metadata = getMetadataArgsStorage();

  const columns = metadata.columns.filter(
    (column) => column.target === Departments,
  );

  alias ??= DEPARTMENT_QUERY_ALIAS;

  if (fields && fields.length > 0) {
    const specified = fields.filter((field) =>
      columns.some((column) => column.propertyName === field),
    );

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

/** * Combines selectable fields from Departments and its createdBy User relation
 * by prefixing them with their respective query aliases for use in TypeORM queries.
 *
 * @param departmentFields - Fields to select from the Departments entity
 * @param creartedByFields - Fields to select from the related User entity
 * @returns Array of fully qualified field names for selection in queries
 */
export function getDepartmentSelectableFields({
  departmentFields,
  departmentAlias,
  creartedByFields,
  userFields,
  userAlias,
}: {
  departmentFields?: string[];
  departmentAlias?: string | undefined;
  creartedByFields?: string[];
  userFields?: string[] | undefined;
  userAlias?: string | undefined;
}): string[] {
  return [
    ...getDepartmentGenericSelectableFields({
      fields: departmentFields,
      alias: departmentAlias,
    }),
    ...getCreatedByGenericSelectableFields(creartedByFields),
    ...getUserGenericSelectableFields({ fields: userFields, alias: userAlias }),
  ];
}
