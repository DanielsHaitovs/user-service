import type { RolePipelineService } from '@/role/role.pipeline';
import type { RoleResponseDto } from '@/roleDto/role.dto';
import { faker } from '@faker-js/faker';

import type { UUID } from 'crypto';

export async function unAssignPermissionFromRole({
  rolePipelineService,
  permissionsToUnassign,
  testRole,
  systemUserId,
}: {
  rolePipelineService: RolePipelineService;
  permissionsToUnassign: string[];
  testRole: RoleResponseDto;
  systemUserId: UUID;
}): Promise<void> {
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
