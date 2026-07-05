import { CacheService } from '@/baseServices/cache.service';
import type { UserWithRoles } from '@/common/pipes/userRoles.pipe';
import type { Roles } from '@/roleEntities/role.entity';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createTestRole } from '@/test/db/role';
import { createTestUser } from '@/test/db/user';
import { assignRoleToUser } from '@/test/db/userRole';
import {
  assignTestRoleToUser,
  getAssignedRolesForUser,
} from '@/test/pipeline/userRole';
import { validateRoleResponseDto } from '@/test/validate/role';
import { UserRolePipelineService } from '@/user/role.pipeline';
import { AuditProducerService } from '@/user/services/audit.service';
import type { User } from '@/userEntities/user.entity';
import { faker } from '@faker-js/faker';
import { UnprocessableEntityException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import { randomUUID, type UUID } from 'crypto';
import type { DataSource } from 'typeorm';

describe('UserRolePipelineService (Integration)', () => {
  let pipelineService: UserRolePipelineService;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let systemUserId: UUID;
  let auditLogSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;
  let cacheInvalidateByIdSpy: jest.SpyInstance;
  let cacheGetByIdSpy: jest.SpyInstance;
  let testUser: User;
  let testRole: Roles;
  let userWithRoles: UserWithRoles;

  beforeAll(async () => {
    ({ dataSource, moduleFixture, systemUserId } = await bootstrapTestApp());

    pipelineService = moduleFixture.get<UserRolePipelineService>(
      UserRolePipelineService,
    );
    auditLogSpy = jest.spyOn(AuditProducerService.prototype, 'sendRoleLog');
    cacheSetSpy = jest.spyOn(CacheService.prototype, 'set');
    cacheGetByIdSpy = jest.spyOn(CacheService.prototype, 'getById');
    cacheInvalidateByIdSpy = jest.spyOn(
      CacheService.prototype,
      'invalidateById',
    );
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    testUser = await createTestUser(dataSource);
    testRole = await createTestRole({
      dataSource,
      overrides: { createdBy: { id: systemUserId } as User },
    });
    userWithRoles = {
      user: await createTestUser(dataSource),
      roles: [
        await createTestRole({
          dataSource,
          overrides: { createdBy: { id: systemUserId } as User },
        }),
      ],
    };
    await assignTestRoleToUser({
      pipelineService,
      data: {
        roleIds: userWithRoles.roles.map((role) => role.id),
      },
      userRoles: { user: userWithRoles.user, roles: [] },
      assignedById: systemUserId,
      cacheInvalidateByIdSpy,
      cacheGetByIdSpy,
      cacheSetSpy,
      auditLogSpy,
    });
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('should be defined', () => {
    expect(pipelineService).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  describe('Assign Role to user', () => {
    it('should assign a role to a user', async () => {
      await pipelineService.assignRolesToUser({
        data: { roleIds: [testRole.id] },
        userRoles: { user: testUser, roles: [] },
        assignedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getAssignedRolesForUser({
        pipelineService,
        userId: testUser.id,
        cacheGetByIdSpy,
        expected: [testRole],
      });
    });
    it('should assign many roles to a user', async () => {
      const role = await createTestRole({
        dataSource,
        overrides: { createdBy: { id: systemUserId } as User },
      });

      await pipelineService.assignRolesToUser({
        data: { roleIds: [testRole.id, role.id] },
        userRoles: { user: testUser, roles: [] },
        assignedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getAssignedRolesForUser({
        pipelineService,
        userId: testUser.id,
        cacheGetByIdSpy,
        expected: [testRole, role],
      });
    });
    it('should assign new role to a user that is already assigned to role', async () => {
      const {
        user: { id: userId },
        roles,
      } = userWithRoles;

      await getAssignedRolesForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: userWithRoles.roles,
      });

      const role = await createTestRole({
        dataSource,
        overrides: { createdBy: { id: systemUserId } as User },
      });

      await pipelineService.assignRolesToUser({
        data: { roleIds: [role.id] },
        userRoles: userWithRoles,
        assignedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      roles.push(role);

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getAssignedRolesForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: roles,
      });
    });
    it('should not assign the same role twice', async () => {
      const {
        user: { id: userId },
        roles,
      } = userWithRoles;

      await pipelineService.assignRolesToUser({
        data: { roleIds: roles.map((role) => role.id) },
        userRoles: userWithRoles,
        assignedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);

      await getAssignedRolesForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: roles,
      });
    });
    it('should throw error if the roleIds array is empty', async () => {
      await expect(
        pipelineService.assignRolesToUser({
          data: { roleIds: [] },
          userRoles: { user: testUser, roles: [] },
          assignedById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException('No role ids provided.'),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);

      await getAssignedRolesForUser({
        pipelineService,
        userId: testUser.id,
        cacheGetByIdSpy,
        expected: [],
      });
    });
    it('should throw error if the provided roleIds does not exist', async () => {
      const nonExistentRoleId = randomUUID();

      await expect(
        pipelineService.assignRolesToUser({
          data: { roleIds: [testRole.id, nonExistentRoleId] },
          userRoles: { user: testUser, roles: [] },
          assignedById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          `Failed to validate role. The following role ids do not exist: ${nonExistentRoleId}`,
        ),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);

      await getAssignedRolesForUser({
        pipelineService,
        userId: testUser.id,
        cacheGetByIdSpy,
        expected: [],
      });
    });
  });

  describe('Unassign Role from user', () => {
    it('should unassign a role from a user', async () => {
      const {
        user: { id: userId },
        roles,
      } = userWithRoles;

      await pipelineService.unassignRolesFromUser({
        data: { roleIds: roles.map((role) => role.id) },
        userRoles: userWithRoles,
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getAssignedRolesForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: [],
      });
    });
    it('should unassign many roles from a user', async () => {
      const {
        user: { id: userId },
        roles,
      } = userWithRoles;

      await assignTestRoleToUser({
        pipelineService,
        data: { roleIds: [testRole.id] },
        userRoles: { user: userWithRoles.user, roles },
        assignedById: systemUserId,
        cacheInvalidateByIdSpy,
        cacheGetByIdSpy,
        cacheSetSpy,
        auditLogSpy,
      });

      roles.push(testRole);

      await pipelineService.unassignRolesFromUser({
        data: { roleIds: roles.map((role) => role.id) },
        userRoles: { user: userWithRoles.user, roles },
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getAssignedRolesForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: [],
      });
    });
    it('should unassign 1 out of many roles to which user is assigned ', async () => {
      const {
        user: { id: userId },
        roles,
      } = userWithRoles;

      await assignTestRoleToUser({
        pipelineService,
        data: { roleIds: [testRole.id] },
        userRoles: { user: userWithRoles.user, roles },
        assignedById: systemUserId,
        cacheInvalidateByIdSpy,
        cacheGetByIdSpy,
        cacheSetSpy,
        auditLogSpy,
      });

      await pipelineService.unassignRolesFromUser({
        data: { roleIds: roles.map((role) => role.id) },
        userRoles: { user: userWithRoles.user, roles },
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(auditLogSpy).toHaveBeenCalledTimes(1);

      await getAssignedRolesForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: [testRole],
      });
    });

    it('should not unassign a role that is not assigned to the user', async () => {
      const {
        user: { id: userId },
        roles,
      } = userWithRoles;

      await pipelineService.unassignRolesFromUser({
        data: { roleIds: [testRole.id] },
        userRoles: userWithRoles,
        requestedById: systemUserId,
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
      });

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);

      await getAssignedRolesForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: roles,
      });
    });

    it('should throw error if the roleIds array is empty', async () => {
      const {
        user: { id: userId },
        roles,
      } = userWithRoles;

      await expect(
        pipelineService.unassignRolesFromUser({
          data: { roleIds: [] },
          userRoles: userWithRoles,
          requestedById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException('No role ids provided.'),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);

      await getAssignedRolesForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: roles,
      });
    });
    it('should throw error if the provided roleIds does not exist', async () => {
      const nonExistentRoleId = randomUUID();
      const {
        user: { id: userId },
        roles,
      } = userWithRoles;

      await expect(
        pipelineService.unassignRolesFromUser({
          data: { roleIds: [nonExistentRoleId] },
          userRoles: userWithRoles,
          requestedById: systemUserId,
          metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
          },
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          `Failed to validate role. The following role ids do not exist: ${nonExistentRoleId}`,
        ),
      );

      expect(cacheInvalidateByIdSpy).toHaveBeenCalledTimes(0);
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(auditLogSpy).toHaveBeenCalledTimes(0);

      await getAssignedRolesForUser({
        pipelineService,
        userId,
        cacheGetByIdSpy,
        expected: roles,
      });
    });
  });

  describe('Get Assigned Roles of a user', () => {
    it('should get roles of a user', async () => {
      const {
        user: { id: userId },
        roles,
      } = userWithRoles;

      const userRoles = await pipelineService.getAssignedRoles(userId);

      expect(userRoles).toBeDefined();
      expect(userRoles.length).toBe(1);

      userRoles.forEach((role) => {
        validateRoleResponseDto({
          response: role,
          expected: roles[0],
        });
      });

      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should get roles of a user and cache it', async () => {
      await assignRoleToUser({
        dataSource,
        userId: testUser.id,
        roleId: testRole.id,
      });

      const userRoles = await pipelineService.getAssignedRoles(testUser.id);

      expect(userRoles).toBeDefined();
      expect(userRoles.length).toBe(1);

      for (const role of userRoles) {
        validateRoleResponseDto({
          response: role,
          expected: testRole,
        });
      }

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should get roles of a user that is not assigned to any role and cache it', async () => {
      const userRoles = await pipelineService.getAssignedRoles(testUser.id);

      expect(userRoles).toBeDefined();
      expect(userRoles.length).toBe(0);

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheGetByIdSpy).toHaveBeenCalledTimes(1);
    });
  });
});
