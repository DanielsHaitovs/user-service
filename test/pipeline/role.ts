import type { GetPermissionDto } from '@/permissionDto/permission.dto';
import type { RolePipelineService } from '@/role/role.pipeline';
import type {
  CreateRoleDto,
  GetRoleDto,
  RoleResponseDto,
} from '@/roleDto/role.dto';
import {
  validateRoleResponseDto,
  validateRoleWithPermissionsResponseDto,
} from '@/test/validate/role';
import { faker } from '@faker-js/faker';

import { randomUUID, type UUID } from 'crypto';

/**
 * Test Utility Factory to seed a Role directly into the test database context.
 * Uses Faker to generate production-grade realistic mock data.
 * @param pipeline - The active execution RolePipelineService
 * @param overrides - Partial properties of the CreateRoleDto to explicitly test
 * @param createdById - The UUID of the user creating the role
 * @returns The fully committed database Role entity
 */
export async function createTestRole({
  pipelineService,
  overrides = {},
  createdById,
}: {
  pipelineService: RolePipelineService;
  overrides?: Partial<CreateRoleDto>;
  createdById: UUID;
}): Promise<RoleResponseDto> {
  const generatedName = `${faker.person.jobArea()} ${faker.person.jobType()}`;

  const createDto = {
    ...{
      name: `Access ${generatedName} - ${randomUUID()}`,
    },
    ...overrides,
  };

  const newRole = await pipelineService.create({
    createDto,
    createdById,
    metadata: {
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
    },
  });

  validateRoleResponseDto({
    response: newRole,
    expected: createDto,
  });

  return newRole;
}

export async function getTestRoleById({
  pipelineService,
  id,
  name,
}: {
  pipelineService: RolePipelineService;
  id: UUID;
  name: string | undefined;
}): Promise<GetRoleDto> {
  const role = await pipelineService.getByIdOrThrow(id);

  validateRoleResponseDto({
    response: role,
    expected: {
      id,
      name,
    } as Partial<GetRoleDto>,
  });

  return role;
}

export async function getTestRoleWithPermissionsById({
  pipelineService,
  id,
  expected,
}: {
  pipelineService: RolePipelineService;
  id: UUID;
  expected: Partial<RoleResponseDto>;
}): Promise<RoleResponseDto> {
  const role = await pipelineService.getPermissionsOrThrow(id);

  validateRoleWithPermissionsResponseDto({
    response: role,
    expected,
  });

  return role;
}

export async function createTestRoleWithPermissions({
  pipelineService,
  role = {},
  permissions,
  createdById,
}: {
  pipelineService: RolePipelineService;
  role?: Partial<CreateRoleDto>;
  permissions?: GetPermissionDto[];
  createdById: UUID;
}): Promise<RoleResponseDto> {
  const newRole = await createTestRole({
    pipelineService,
    overrides: role,
    createdById,
  });

  if (permissions && permissions.length > 0) {
    await pipelineService.assignPermissionsToRole({
      role: newRole,
      assignPayload: {
        permissionCodes: permissions.map((p) => p.code),
      },
      requestedByUserId: createdById,
      metadata: {
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
      },
    });

    newRole.permissions = permissions;
  }

  return newRole;
}
