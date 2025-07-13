import { Department } from '@/department/entities/department.entity';

import { getMetadataArgsStorage } from 'typeorm';

/**
 * Dynamically extract all column names from the Department entity using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getDepartmentSelectableFields(fields?: string[]): string[] {
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
    'id',
    'createdAt',
    'updatedAt',
    ...columns.map((column) => column.propertyName),
  ];
}
