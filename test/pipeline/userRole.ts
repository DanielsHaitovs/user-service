import { Roles } from '@/roleEntities/role.entity';
import { User } from '@/userEntities/user.entity';
import { UserRoles } from '@/userEntities/userRoles.entity';

import type { UUID } from 'crypto';
import type { DataSource } from 'typeorm';

/**
 * Test Utility Factory to seed a Role directly into the test database context.
 * Uses Faker to generate production-grade realistic mock data.
 *
 * @param dataSource - The active execution TypeORM DataSource
 * @param overrides - Partial properties of the Role entity to explicitly test
 * @returns The fully committed database Role entity
 */
export async function assignRoleToUser({
  dataSource,
  userId,
  roleId,
}: {
  dataSource: DataSource;
  userId: UUID;
  roleId: UUID;
}): Promise<UserRoles> {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Roles);
  const userRoleRepository = dataSource.getRepository(UserRoles);

  const user = await userRepository.findOneByOrFail({ id: userId });
  const role = await roleRepository.findOneByOrFail({ id: roleId });

  const userRole = userRoleRepository.create({
    user,
    role,
  });

  return await userRoleRepository.save(userRole);
}
