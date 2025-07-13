import { Department } from '@/department/entities/department.entity';
import { COUNTRIES } from '@/lib/const/countries.const';
import {
  SYSTEM_USER_EMAIL,
  SYSTEM_USER_PASSWORD,
} from '@/lib/const/user.const';
import { Permission } from '@/role/entities/permissions.entity';
import { Role } from '@/role/entities/role.entity';
import { User } from '@/user/entities/user.entity';
import { UserRole } from '@/user/entities/userRoles.entity';
import type { INestApplication } from '@nestjs/common';

import { DataSource } from 'typeorm';

export async function ensureSystemUser(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);

  const existing = await userRepo.findOne({
    where: { email: SYSTEM_USER_EMAIL },
  });

  if (existing) {
    return;
  }

  const systemDepartment = await createSystemDepartment(dataSource);
  await createSystemRole(dataSource);

  const newUser = userRepo.create({
    email: SYSTEM_USER_EMAIL,
    firstName: 'System',
    lastName: 'User',

    password: SYSTEM_USER_PASSWORD,
    departments: [systemDepartment],
    isActive: true,
    isEmailVerified: true,
    isTwoFactorEnabled: false,
  });

  await userRepo.save(newUser);

  await createUserRole(dataSource);
}

async function createSystemDepartment(
  dataSource: DataSource,
): Promise<Department> {
  // Implement department creation logic here
  const departmentRepo = dataSource.getRepository(Department);

  const existingDepartment = await departmentRepo.findOne({
    where: { name: 'System' },
  });

  if (existingDepartment) {
    return existingDepartment;
  }

  const systemDepartment = departmentRepo.create({
    name: 'System',
    country: COUNTRIES.US,
  });

  return await departmentRepo.save(systemDepartment);
}

async function createSystemRole(dataSource: DataSource): Promise<void> {
  const roleRepo = dataSource.getRepository(Role);

  const existingRole = await roleRepo.findOne({
    where: { name: 'System' },
    relations: ['permissions'],
  });

  if (existingRole) {
    return;
  }

  const newRole = roleRepo.create({
    name: 'System',
  });

  const systemRole = await roleRepo.save(newRole);
  const permissionRepo = dataSource.getRepository(Permission);

  const newPermissions = permissionRepo.create({
    name: 'System Permissions',
    code: 'root_all',
    role: systemRole,
  });

  await permissionRepo.save(newPermissions);
}

async function createUserRole(dataSource: DataSource): Promise<UserRole> {
  const userRoleRepo = dataSource.getRepository(UserRole);
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);

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
    user: existingUser,
    role: existingRole,
    assignedBy: existingUser, // Assuming the user is assigned by themselves
  });

  return await userRoleRepo.save(userRole);
}
