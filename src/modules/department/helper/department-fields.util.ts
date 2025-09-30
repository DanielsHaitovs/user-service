import { Department } from '@/department/entities/department.entity';
import { DEPARTMENT_QUERY_ALIAS } from '@/lib/const/department.const';
import { getCreatedBySelectableFields } from '@/user/helper/user-fields.util';

import { getMetadataArgsStorage } from 'typeorm';

/**
 * Dynamically extract all column names from the Department entity using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getDepartmentGenericSelectableFields(
  fields?: string[],
): string[] {
  const metadata = getMetadataArgsStorage();

  // Get all columns for the User entity
  const columns = metadata.columns.filter(
    (column) => column.target === Department,
  );

  if (fields && fields.length > 0) {
    return fields.filter((field) =>
      columns.some((column) => column.propertyName === field),
    );
  }

  // Extract column property names
  return [
    `${DEPARTMENT_QUERY_ALIAS}.id`,
    `${DEPARTMENT_QUERY_ALIAS}.createdAt`,
    `${DEPARTMENT_QUERY_ALIAS}.updatedAt`,
    ...columns.map(
      (column) => `${DEPARTMENT_QUERY_ALIAS}.${column.propertyName}`,
    ),
  ];
}

/** * Combines selectable fields from Department and its createdBy User relation
 * by prefixing them with their respective query aliases for use in TypeORM queries.
 *
 * @param departmentFields - Fields to select from the Department entity
 * @param creartedByFields - Fields to select from the related User entity
 * @returns Array of fully qualified field names for selection in queries
 */
export function getDepartmentSelectableFields({
  departmentFields,
  creartedByFields,
}: {
  departmentFields?: string[];
  creartedByFields?: string[];
}): string[] {
  return [
    ...getDepartmentGenericSelectableFields(departmentFields),
    ...getCreatedBySelectableFields(creartedByFields),
  ];
}
