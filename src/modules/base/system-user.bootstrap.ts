import { COUNTRIES } from '@/lib/countries.const';
import { ROOT_ADMIN_PERMISSION } from '@/roleConst/permission.const';
import { Permission } from '@/roleEntities/permissions.entity';
import { Roles } from '@/roleEntities/role.entity';
import {
  SYSTEM_USER_EMAIL,
  SYSTEM_USER_PASSWORD,
} from '@/userConst/user.const';
import { User } from '@/userEntities/user.entity';
import { UserRole } from '@/userEntities/userRoles.entity';
import type { INestApplication } from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import type { UUID } from 'crypto';
import { DataSource } from 'typeorm';

export async function ensureSystemUser(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);

  const existing = await userRepo.findOne({
    where: { email: SYSTEM_USER_EMAIL },
  });

  if (existing != undefined) {
    return;
  }

  const newUser = userRepo.create({
    email: SYSTEM_USER_EMAIL,
    firstName: 'System',
    lastName: 'User',

    password: await bcrypt.hash(SYSTEM_USER_PASSWORD, 10),
    country: COUNTRIES.US,
    isActive: true,
    isEmailVerified: true,
    isTwoFactorEnabled: false,
  });

  await userRepo.save(newUser);
  await createSystemRole(dataSource, newUser.id);
  await createUserRole(dataSource);
}

async function createSystemRole(
  dataSource: DataSource,
  createdBy: UUID,
): Promise<void> {
  const roleRepo = dataSource.getRepository(Roles);

  const existingRole = await roleRepo.findOne({
    where: { name: 'System' },
    relations: ['permissions'],
  });

  if (existingRole) {
    return;
  }

  const newRole = roleRepo.create({
    name: 'System',
    createdBy: { id: createdBy } as User,
  });

  const systemRole = await roleRepo.save(newRole);
  const permissionRepo = dataSource.getRepository(Permission);

  const newPermissions = permissionRepo.create({
    name: 'System Permissions',
    code: ROOT_ADMIN_PERMISSION,
    roles: [{ id: systemRole.id } as Roles],
    createdBy: { id: createdBy } as User,
  });

  await permissionRepo.save(newPermissions);
}

async function createUserRole(dataSource: DataSource): Promise<UserRole> {
  const userRoleRepo = dataSource.getRepository(UserRole);
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Roles);

  const existingRole = await roleRepo.findOne({
    where: { name: 'System' },
  });

  const existingUser = await userRepo.findOne({
    where: { email: 'system@mecService.com' },
  });

  if (existingUser == null || existingRole == null) {
    throw new Error('System user or role not found');
  }

  const userRole = userRoleRepo.create({
    users: existingUser,
    roles: existingRole,
    assignedBy: existingUser,
  });

  return await userRoleRepo.save(userRole);
}
