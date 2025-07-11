import { Department } from '@/department/entities/department.entity';

import { getMetadataArgsStorage } from 'typeorm';

/**
 * Dynamically extract all column names from the Department entity using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getDepartmentSelectableFields(): string[] {
  const metadata = getMetadataArgsStorage();

  // Get all columns for the User entity
  const columns = metadata.columns.filter(
    (column) => column.target === Department,
  );

  // Extract column property names
  return [
    'id',
    'createdAt',
    'updatedAt',
    ...columns.map((column) => column.propertyName),
  ];
}
