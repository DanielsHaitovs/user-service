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
  cacheSetSpy,
  auditLogSpy,
}: {
  pipelineService: RolePipelineService;
  overrides?: Partial<CreateRoleDto>;
  createdById: UUID;
  cacheSetSpy: jest.SpyInstance;
  auditLogSpy: jest.SpyInstance;
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

  expect(cacheSetSpy).toHaveBeenCalledTimes(2);
  expect(auditLogSpy).toHaveBeenCalledTimes(1);

  cacheSetSpy.mockClear();
  auditLogSpy.mockClear();

  return newRole;
}

export async function getTestRoleById({
  pipelineService,
  id,
  name,
  cacheGetByIdSpy,
  cacheSetSpy,
  setCache,
}: {
  pipelineService: RolePipelineService;
  id: UUID;
  name: string | undefined;
  cacheGetByIdSpy: jest.SpyInstance;
  cacheSetSpy: jest.SpyInstance;
  setCache?: boolean;
}): Promise<GetRoleDto> {
  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  const response = await pipelineService.getByIdOrThrow(id);

  validateRoleResponseDto({
    response,
    expected: {
      id,
      name,
    } as Partial<GetRoleDto>,
  });

  expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);

  if (setCache != undefined && setCache) {
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  } else {
    expect(cacheSetSpy).toHaveBeenCalledTimes(0);
  }

  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  return response;
}

export async function getTestRoleWithPermissionsById({
  pipelineService,
  id,
  expected,
  cacheGetByIdSpy,
  cacheSetSpy,
  setCache,
}: {
  pipelineService: RolePipelineService;
  id: UUID;
  expected: Partial<RoleResponseDto>;
  cacheGetByIdSpy: jest.SpyInstance;
  cacheSetSpy: jest.SpyInstance;
  setCache?: boolean;
}): Promise<RoleResponseDto> {
  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  const response = await pipelineService.getPermissionsOrThrow(id);

  validateRoleWithPermissionsResponseDto({
    response,
    expected,
  });

  expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);

  if (setCache != undefined && setCache) {
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  } else {
    expect(cacheSetSpy).toHaveBeenCalledTimes(0);
  }

  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  return response;
}

export async function createTestRoleWithPermissions({
  pipelineService,
  role = {},
  permissions,
  createdById,
  cacheSetSpy,
  auditLogSpy,
  cacheInvalidateByIdSpy,
}: {
  pipelineService: RolePipelineService;
  role?: Partial<CreateRoleDto>;
  permissions?: GetPermissionDto[];
  createdById: UUID;
  cacheSetSpy: jest.SpyInstance;
  auditLogSpy: jest.SpyInstance;
  cacheInvalidateByIdSpy: jest.SpyInstance;
}): Promise<RoleResponseDto> {
  cacheSetSpy.mockClear();
  auditLogSpy.mockClear();
  cacheInvalidateByIdSpy.mockClear();

  const newRole = await createTestRole({
    pipelineService,
    overrides: role,
    createdById,
    cacheSetSpy,
    auditLogSpy,
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

    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
    expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
    expect(auditLogSpy).toHaveBeenCalledTimes(1);
  }

  cacheSetSpy.mockClear();
  auditLogSpy.mockClear();
  cacheInvalidateByIdSpy.mockClear();

  return newRole;
}
