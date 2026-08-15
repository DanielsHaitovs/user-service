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
  rolePipelineService,
  overrides = {},
  createdById,
  cacheSetSpy,
  cacheInvalidateByTagsSpy,
  auditLogSpy,
}: {
  rolePipelineService: RolePipelineService;
  overrides?: Partial<CreateRoleDto>;
  createdById: UUID;
  cacheSetSpy: jest.SpyInstance;
  cacheInvalidateByTagsSpy: jest.SpyInstance;
  auditLogSpy?: jest.SpyInstance | undefined;
}): Promise<RoleResponseDto> {
  cacheSetSpy.mockClear();
  cacheInvalidateByTagsSpy.mockClear();

  if (auditLogSpy) auditLogSpy.mockClear();

  const generatedName = `${faker.person.jobArea()} ${faker.person.jobType()}`;

  const createDto = {
    ...{
      name: `Access ${generatedName} - ${randomUUID()}`,
    },
    ...overrides,
  };

  const newRole = await rolePipelineService.create({
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

  if (auditLogSpy) {
    expect(auditLogSpy).toHaveBeenCalledTimes(1);
    auditLogSpy.mockClear();
  }

  cacheSetSpy.mockClear();
  cacheInvalidateByTagsSpy.mockClear();

  return newRole;
}

export async function getTestRoleById({
  rolePipelineService,
  id,
  name,
  cacheGetByIdSpy,
  cacheSetSpy,
  setCache,
}: {
  rolePipelineService: RolePipelineService;
  id: UUID;
  name: string | undefined;
  cacheGetByIdSpy: jest.SpyInstance;
  cacheSetSpy: jest.SpyInstance;
  setCache?: boolean;
}): Promise<GetRoleDto> {
  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  const response = await rolePipelineService.getByIdOrThrow(id);

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
  rolePipelineService,
  id,
  expected,
  cacheGetByIdSpy,
  cacheSetSpy,
  setCache,
}: {
  rolePipelineService: RolePipelineService;
  id: UUID;
  expected: Partial<RoleResponseDto>;
  cacheGetByIdSpy: jest.SpyInstance;
  cacheSetSpy: jest.SpyInstance;
  setCache?: boolean;
}): Promise<RoleResponseDto> {
  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  const response = await rolePipelineService.getPermissionsOrThrow(id);

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
  rolePipelineService,
  role = {},
  permissions,
  createdById,
  cacheSetSpy,
  auditLogSpy,
  cacheInvalidateByIdSpy,
  cacheInvalidateByTagsSpy,
  cacheInvalidateByKeyPatternSpy,
}: {
  rolePipelineService: RolePipelineService;
  role?: Partial<CreateRoleDto>;
  permissions?: GetPermissionDto[];
  createdById: UUID;
  auditLogSpy?: jest.SpyInstance;
  cacheSetSpy: jest.SpyInstance;
  cacheInvalidateByIdSpy: jest.SpyInstance;
  cacheInvalidateByTagsSpy: jest.SpyInstance;
  cacheInvalidateByKeyPatternSpy: jest.SpyInstance;
}): Promise<RoleResponseDto> {
  cacheSetSpy.mockClear();

  if (auditLogSpy) {
    auditLogSpy.mockClear();
  }

  cacheInvalidateByIdSpy.mockClear();
  cacheInvalidateByKeyPatternSpy.mockClear();

  const newRole = await createTestRole({
    rolePipelineService,
    overrides: role,
    createdById,
    cacheSetSpy,
    cacheInvalidateByTagsSpy,
    auditLogSpy,
  });

  if (permissions && permissions.length > 0) {
    await rolePipelineService.assignPermissionsToRole({
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
    expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(1);

    if (auditLogSpy) {
      expect(auditLogSpy).toHaveBeenCalledTimes(1);
      auditLogSpy.mockClear();
    }
  }

  cacheSetSpy.mockClear();
  cacheInvalidateByIdSpy.mockClear();
  cacheInvalidateByKeyPatternSpy.mockClear();

  return newRole;
}
