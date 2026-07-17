import type { UserWithRoles } from '@/common/pipes/userRoles.pipe';
import type { GetRelatedRoleDto, GetRoleDto } from '@/roleDto/role.dto';
import { validateRoleResponseDto } from '@/test/validate/role';
import type { UserRolePipelineService } from '@/user/role.pipeline';
import type { AssignRolesToUserDto } from '@/userDto/roles.dto';
import { faker } from '@faker-js/faker';

import type { UUID } from 'crypto';

/**
 * Test Utility Factory to seed a Role directly into the test database context.
 * Uses Faker to generate production-grade realistic mock data.
 *
 * @param dataSource - The active execution TypeORM DataSource
 * @param overrides - Partial properties of the Role entity to explicitly test
 * @returns The fully committed database Role entity
 */
export async function assignTestRoleToUser({
  userRolePipelineService,
  data,
  userRoles,
  assignedById,
  cacheInvalidateByIdSpy,
  cacheSetSpy,
  cacheGetByIdSpy,
  auditLogSpy,
}: {
  userRolePipelineService: UserRolePipelineService;
  data: AssignRolesToUserDto;
  userRoles: UserWithRoles;
  assignedById: UUID;
  cacheSetSpy: jest.SpyInstance;
  cacheGetByIdSpy: jest.SpyInstance;
  cacheInvalidateByIdSpy: jest.SpyInstance;
  auditLogSpy?: jest.SpyInstance;
}): Promise<void> {
  cacheSetSpy.mockClear();
  cacheInvalidateByIdSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  if (auditLogSpy != undefined) {
    auditLogSpy.mockClear();
  }

  await userRolePipelineService.assignRolesToUser({
    data,
    userRoles,
    assignedById,
    metadata: {
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
    },
  });

  expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(2);
  expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);

  cacheSetSpy.mockClear();
  cacheInvalidateByIdSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  if (auditLogSpy != undefined) {
    expect(auditLogSpy).toHaveBeenCalledTimes(1);
    auditLogSpy.mockClear();
  }
}

export async function getAssignedRolesForUser({
  userRolePipelineService,
  userId,
  expected,
  cacheGetByIdSpy,
  cacheSetSpy,
}: {
  userRolePipelineService: UserRolePipelineService;
  userId: UUID;
  expected?: Partial<GetRoleDto>[] | undefined;
  cacheGetByIdSpy?: jest.SpyInstance;
  cacheSetSpy?: jest.SpyInstance;
}): Promise<GetRelatedRoleDto[]> {
  if (cacheGetByIdSpy) {
    cacheGetByIdSpy.mockClear();
  }

  if (cacheSetSpy) {
    cacheSetSpy.mockClear();
  }

  const userRoles = await userRolePipelineService.getAssignedRoles(userId);

  expect(userRoles).toBeDefined();

  if (expected != undefined && expected.length > 0) {
    expect(userRoles.length).toBe(expected.length);
    const expectedRolesMap = new Map(expected.map((s) => [s.id, s]));

    userRoles.forEach((role) => {
      const expectedStore = expectedRolesMap.get(role.id);

      validateRoleResponseDto({
        response: role,
        expected: expectedStore,
      });
    });
  } else {
    expect(userRoles.length).toBe(0);
  }

  if (cacheGetByIdSpy != undefined) {
    expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    cacheGetByIdSpy.mockClear();
  }

  if (cacheSetSpy != undefined) {
    expect(cacheSetSpy).toHaveBeenCalledTimes(1);
    cacheSetSpy.mockClear();
  }

  return userRoles;
}
