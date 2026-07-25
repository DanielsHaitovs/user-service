import type { AuthenticateDto, AuthenticateResponseDto } from '@/auth/auth.dto';
import type { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import { unAssignPermissionFromRole } from '@/test/pipeline/rolePermissions';
import type { UserRolePipelineService } from '@/user/role.pipeline';
import { HttpStatus } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import type { UUID } from 'crypto';

export async function loginTestUser({
  app,
  email,
  password,
  cacheSetSpy,
  cacheGetByIdSpy,
}: {
  app: NestFastifyApplication;
  email: string;
  password: string;
  cacheSetSpy: jest.SpyInstance;
  cacheGetByIdSpy: jest.SpyInstance;
}): Promise<{ Authorization: string }> {
  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  const payload: AuthenticateDto = {
    email,
    password,
  };

  const response = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload,
  });

  expect(response.statusCode).toBe(HttpStatus.CREATED);

  const body = JSON.parse(response.payload) as AuthenticateResponseDto;

  expect(body).toHaveProperty('token');
  expect(typeof body.token).toBe('string');

  expect(cacheSetSpy).toHaveBeenCalledTimes(1);
  expect(cacheGetByIdSpy).toHaveBeenCalledTimes(3);

  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();

  return {
    Authorization: `Bearer ${body.token}`,
  };
}

export async function changePermissionsForTestUser({
  permissionsToUnassign,
  systemUserId,
  rolePipelineService,
  userRolePipelineService,
  testRole,
  cacheSetSpy,
  cacheGetByIdSpy,
  cacheInvalidateByIdSpy,
  cacheInvalidateByTagsSpy,
  cacheInvalidateByKeyPatternSpy,
  app,
  testUser,
}: {
  permissionsToUnassign: string[];
  systemUserId: UUID;
  rolePipelineService: RolePipelineService;
  userRolePipelineService: UserRolePipelineService;
  testRole: RoleResponseDto;
  cacheSetSpy: jest.SpyInstance;
  cacheGetByIdSpy: jest.SpyInstance;
  cacheInvalidateByIdSpy: jest.SpyInstance;
  cacheInvalidateByTagsSpy: jest.SpyInstance;
  cacheInvalidateByKeyPatternSpy: jest.SpyInstance;
  app: NestFastifyApplication;
  testUser: {
    id: UUID;
    email: string;
    password: string;
  };
}): Promise<{
  Authorization: string;
}> {
  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();
  cacheInvalidateByIdSpy.mockClear();
  cacheInvalidateByTagsSpy.mockClear();
  cacheInvalidateByKeyPatternSpy.mockClear();

  await unAssignPermissionFromRole({
    rolePipelineService,
    testRole,
    permissionsToUnassign,
    systemUserId,
    cacheSetSpy,
    cacheGetByIdSpy,
    cacheInvalidateByIdSpy,
    cacheInvalidateByTagsSpy,
    cacheInvalidateByKeyPatternSpy,
  });

  await userRolePipelineService.getPermissions(testUser.id);

  const headers = await loginTestUser({
    app,
    email: testUser.email,
    password: testUser.password,
    cacheSetSpy,
    cacheGetByIdSpy,
  });

  cacheSetSpy.mockClear();
  cacheGetByIdSpy.mockClear();
  cacheInvalidateByIdSpy.mockClear();
  cacheInvalidateByTagsSpy.mockClear();
  cacheInvalidateByKeyPatternSpy.mockClear();

  return headers;
}
