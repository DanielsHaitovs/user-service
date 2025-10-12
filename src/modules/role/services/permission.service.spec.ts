import type { CreatePermissionDto } from '@/role/dto/permission.dto';
import { RoleService } from '@/role/services/role.service';
import { getSystemUserId } from '@/test/api/auth-user-api';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { createPermissions } from '@/test/factories/permission.factory';
import { ConflictException, type INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import type { App } from 'supertest/types';

import { PermissionService } from './permission.service';

describe('PermissionService (Integration - PostgreSQL)', () => {
  let app: INestApplication<App>;
  let module: TestingModule;
  let permissionService: PermissionService;
  let roleService: RoleService;
  let systemUserId: UUID;

  beforeAll(async () => {
    ({ moduleFixture: module, app } = await bootstrapTestApp());

    roleService = module.get<RoleService>(RoleService);
    permissionService = module.get<PermissionService>(PermissionService);
    systemUserId = await getSystemUserId(app);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('create()', () => {
    it('should create and persist permissions with user Permission', async () => {
      await createPermissions(
        roleService,
        permissionService,
        systemUserId,
        true,
      );
    });

    it('should create and persist permissions without user Permission', async () => {
      await createPermissions(
        roleService,
        permissionService,
        systemUserId,
        false,
      );
    });

    // it('should throw Conflict error beacuse at least 1 name of permissions already exists', async () => {
    //   const permissions = await createPermissions(
    //     roleService,
    //     permissionService,
    //     systemUserId,
    //     true,
    //   );

    //   const conflictPermissinos = new Array<CreatePermissionDto>();

    //   permissions.forEach((permission) => {
    //     if (permission.roles[0] === undefined) {
    //       throw new Error('Permission should have a role');
    //     }
    //     conflictPermissinos.push({
    //       name: permission.name,
    //       code: `${permission.code}-1`,
    //       roleIds: [permission.roles[0].id],
    //     });
    //   });

    //   await expect(
    //     permissionService.create({
    //       permissions: conflictPermissinos,
    //       createdBy: systemUserId,
    //       hasUserPermission: true,
    //     }),
    //   ).rejects.toThrow(ConflictException);
    // });

    // it('should throw Conflict error beacuse at least 1 code of permissions already exists', async () => {
    //   const permissions = await createPermissions(
    //     roleService,
    //     permissionService,
    //     systemUserId,
    //     true,
    //   );

    //   const conflictPermissinos = new Array<CreatePermissionDto>();

    //   permissions.forEach((permission) => {
    //     if (permission.roles[0] === undefined) {
    //       throw new Error('Permission should have a role');
    //     }
    //     conflictPermissinos.push({
    //       name: `${permission.name}-1`,
    //       code: permission.code,
    //       roleIds: [permission.roles[0].id],
    //     });
    //   });

    //   await expect(
    //     permissionService.create({
    //       permissions: conflictPermissinos,
    //       createdBy: systemUserId,
    //       hasUserPermission: true,
    //     }),
    //   ).rejects.toThrow(ConflictException);
    // });
  });

  //   describe('findByIds()', () => {
  //     it('should find permissions by uuids', async () => {
  //       await findPermissionsByIds(roleService, permissionService, systemUserId);
  //     });

  //     it('should throw not found exception, because permission id(s) does not exist', async () => {
  //       await expect(
  //         permissionService.findByIds([uuid() as UUID]),
  //       ).rejects.toThrow(EntityNotFoundError);
  //     });
  //   });
  //   describe('searchFor()', () => {
  //     it('should find permissions by value', async () => {
  //       await findPermissionsByIds(roleService, permissionService, systemUserId);
  //     });
  //   });

  //   describe('findByCodes()', () => {
  //     it('should find permissions by codes', async () => {
  //       await findPermissionsByCodes(
  //         roleService,
  //         permissionService,
  //         systemUserId,
  //       );
  //     });

  //     it('should throw not found exception, because permission code(s) does not exist', async () => {
  //       await expect(
  //         permissionService.findByCodes([
  //           faker.string.alpha(8),
  //           faker.string.alpha(8),
  //         ]),
  //       ).rejects.toThrow(EntityNotFoundError);
  //     });
  //   });

  //   describe('update()', () => {
  //     it('should update and persist permissions', async () => {
  //       await updatePermissions(roleService, permissionService, systemUserId);
  //     });

  //     it('should throw Conflict error beacuse name of permissions already exists', async () => {
  //       const permissions = await createPermissions(
  //         roleService,
  //         permissionService,
  //         systemUserId,
  //       );

  //       const [firstPermission, secondPermission] = permissions;

  //       if (firstPermission === undefined || secondPermission === undefined) {
  //         throw new Error('Permissino should be defined');
  //       }

  //       const faulsyPermissionDto: UpdatePermissionDto = {
  //         name: secondPermission.name,
  //       };

  //       await expect(
  //         permissionService.update(firstPermission.id, faulsyPermissionDto),
  //       ).rejects.toThrow(ConflictException);
  //     });
  //     it('should throw Conflict error beacuse code of permissions already exists', async () => {
  //       const permissions = await createPermissions(
  //         roleService,
  //         permissionService,
  //         systemUserId,
  //       );

  //       const [firstPermission, secondPermission] = permissions;

  //       if (firstPermission === undefined || secondPermission === undefined) {
  //         throw new Error('Permissino should be defined');
  //       }

  //       const faulsyPermissionDto: UpdatePermissionDto = {
  //         code: secondPermission.code,
  //       };

  //       await expect(
  //         permissionService.update(firstPermission.id, faulsyPermissionDto),
  //       ).rejects.toThrow(ConflictException);
  //     });

  //     it('should throw Conflict error beacuse at least code or name of permissions already exists', async () => {
  //       const permissions = await createPermissions(
  //         roleService,
  //         permissionService,
  //         systemUserId,
  //       );

  //       const [firstPermission, secondPermission] = permissions;

  //       if (firstPermission === undefined || secondPermission === undefined) {
  //         throw new Error('Permissino should be defined');
  //       }

  //       const faulsyPermissionDto: UpdatePermissionDto = {
  //         name: secondPermission.name,
  //         code: secondPermission.code,
  //       };

  //       await expect(
  //         permissionService.update(firstPermission.id, faulsyPermissionDto),
  //       ).rejects.toThrow(ConflictException);
  //     });
  //   });

  //   describe('deleteIds()', () => {
  //     it('should delete permissions by uuids', async () => {
  //       await deletePermissionsByIds(
  //         roleService,
  //         permissionService,
  //         systemUserId,
  //       );
  //     });

  //     it('should throw not found exception, because permission id(s) does not exist', async () => {
  //       await expect(
  //         permissionService.deleteByIds([uuid() as UUID]),
  //       ).rejects.toThrow(EntityNotFoundError);
  //     });
  //   });
});
