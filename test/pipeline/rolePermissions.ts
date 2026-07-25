import type { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import { faker } from '@faker-js/faker';

import type { UUID } from 'crypto';

export async function unAssignPermissionFromRole({
  rolePipelineService,
  permissionsToUnassign,
  testRole,
  systemUserId,
  cacheSetSpy,
  cacheGetByIdSpy,
  cacheInvalidateByIdSpy,
  cacheInvalidateByTagsSpy,
  cacheInvalidateByKeyPatternSpy,
}: {
  rolePipelineService: RolePipelineService;
  permissionsToUnassign: string[];
  testRole: RoleResponseDto;
  systemUserId: UUID;
  cacheSetSpy: jest.SpyInstance;
  cacheGetByIdSpy: jest.SpyInstance;
  cacheInvalidateByIdSpy: jest.SpyInstance;
  cacheInvalidateByTagsSpy: jest.SpyInstance;
  cacheInvalidateByKeyPatternSpy: jest.SpyInstance;
}): Promise<void> {
  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();
  cacheInvalidateByIdSpy.mockClear();
  cacheInvalidateByTagsSpy.mockClear();
  cacheInvalidateByKeyPatternSpy.mockClear();

  await rolePipelineService.unassignPermissionsFromRole({
    unassignPayload: {
      permissionCodes: permissionsToUnassign,
    },
    role: testRole,
    requestedByUserId: systemUserId,
    metadata: {
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
    },
  });

  expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  expect(cacheGetByIdSpy).toHaveBeenCalledTimes(0);
  expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
  expect(cacheInvalidateByTagsSpy).toHaveBeenCalledTimes(0);
  expect(cacheInvalidateByKeyPatternSpy).toHaveBeenCalledTimes(1);

  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();
  cacheInvalidateByIdSpy.mockClear();
  cacheInvalidateByTagsSpy.mockClear();
  cacheInvalidateByKeyPatternSpy.mockClear();
}

export async function assignPermissionFromRole({
  rolePipelineService,
  permissionsToAssign,
  testRole,
  systemUserId,
}: {
  rolePipelineService: RolePipelineService;
  permissionsToAssign: string[];
  testRole: RoleResponseDto;
  systemUserId: UUID;
}): Promise<void> {
  await rolePipelineService.assignPermissionsToRole({
    assignPayload: {
      permissionCodes: permissionsToAssign,
    },
    role: testRole,
    requestedByUserId: systemUserId,
    metadata: {
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
    },
  });
}
