import { User } from '@/user/entities/user.entity';

import { getMetadataArgsStorage } from 'typeorm';

/**
 * Dynamically extract all column names from the User entity using TypeORM metadata
 * This automatically updates when you add/remove columns from the entity
 */
export function getUserSelectableFields(): string[] {
  const metadata = getMetadataArgsStorage();

  // Get all columns for the User entity
  const columns = metadata.columns.filter((column) => column.target === User);

  // Extract column property names
  return [
    'id',
    'createdAt',
    'updatedAt',
    ...columns.map((column) => column.propertyName),
  ];
}
