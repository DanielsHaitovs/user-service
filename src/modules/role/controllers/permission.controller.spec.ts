// import {
//   CREATE_PERMISSION,
//   DELETE_PERMISSION,
//   READ_PERMISSION,
//   READ_ROLE,
//   UPDATE_PERMISSION,
// } from '@/lib/const/role.const';
// import { initTestUser, systemUserAuthToken } from '@/test/api/auth-user-api';
// import {
//   createNewPermissionApi,
//   deletePermissionsApi,
//   findPermissionsByCodesApi,
//   findPermissionsByIdsApi,
//   generateNewPermissionsApi,
//   searchPermissionsByValueApi,
//   updatePermissionsApi,
// } from '@/test/api/permissions-api';
// import { bootstrapTestApp } from '@/test/bootstrap-e2e';
// import {
//   BadRequestException,
//   ConflictException,
//   ForbiddenException,
//   type INestApplication,
//   UnauthorizedException,
// } from '@nestjs/common';

// import type { UUID } from 'crypto';
// import type { Server } from 'http';
// import * as request from 'supertest';
// import type { App } from 'supertest/types';
// import { EntityNotFoundError } from 'typeorm';
// import { v4 as uuid } from 'uuid';

// describe('PermissionController', () => {
//   let app: INestApplication<App>;
//   let systemToken: string;
//   let httpServer: Server;

//   beforeAll(async () => {
//     ({ app } = await bootstrapTestApp());
//     httpServer = app.getHttpServer() as Server;
//     systemToken = await systemUserAuthToken(app);
//   });

//   afterAll(async () => {
//     await app.close();
//   });

//   describe('/permissions (POST)', () => {
//     it('/permissions (POST) - should allow to create new permissions', async () => {
//       const { accessToken: userToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, CREATE_PERMISSION, READ_PERMISSION],
//         true,
//       );

//       await generateNewPermissionsApi(app, userToken);
//     });
//     it('/permissions (POST) - should not allow to create new permissions because user was not verified', async () => {
//       const { accessToken: userToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, CREATE_PERMISSION, READ_PERMISSION],
//         false,
//       );

//       await expect(generateNewPermissionsApi(app, userToken)).rejects.toThrow(
//         UnauthorizedException,
//       );
//     });
//     it('/permissions (POST) - should not allow to create new permissions because user access is forbiden', async () => {
//       await expect(generateNewPermissionsApi(app, '')).rejects.toThrow(
//         UnauthorizedException,
//       );
//     });
//     it('/permissions (POST) - should not allow to create new permissions because its missing permission to read permissions entity', async () => {
//       const { accessToken: userToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, CREATE_PERMISSION],
//         true,
//       );

//       await expect(generateNewPermissionsApi(app, userToken)).rejects.toThrow(
//         ForbiddenException,
//       );
//     });
//     it('/permissions (POST) - should not allow to create new permissions because its missing permission to create permissions entity', async () => {
//       const { accessToken: userToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, READ_PERMISSION],
//         true,
//       );

//       await expect(generateNewPermissionsApi(app, userToken)).rejects.toThrow(
//         ForbiddenException,
//       );
//     });
//     it('/permissions (POST) - should not allow to create new permissions because its missing permission to read role entity', async () => {
//       const { accessToken: userToken } = await initTestUser(
//         app,
//         systemToken,
//         [CREATE_PERMISSION, READ_PERMISSION],
//         true,
//       );

//       await expect(generateNewPermissionsApi(app, userToken)).rejects.toThrow(
//         ForbiddenException,
//       );
//     });
//     it('/permissions (POST) - should not allow to create new permissions because its missing required permissions', async () => {
//       const { accessToken: userToken } = await initTestUser(
//         app,
//         systemToken,
//         [],
//         true,
//       );

//       await expect(generateNewPermissionsApi(app, userToken)).rejects.toThrow(
//         ForbiddenException,
//       );
//     });
//     it('/permissions (POST) - should not allow to create new permissions body is missing', async () => {
//       const { accessToken: userToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, CREATE_PERMISSION, READ_PERMISSION],
//         true,
//       );

//       await expect(createNewPermissionApi(app, userToken, [])).rejects.toThrow(
//         BadRequestException,
//       );
//     });
//     it('/permissions (POST) - should not allow to create new permissions body is missing permission code', async () => {
//       const { accessToken: userToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, CREATE_PERMISSION, READ_PERMISSION],
//         true,
//       );

//       await expect(
//         createNewPermissionApi(app, userToken, [{ name: 'Name', roleIds: [] }]),
//       ).rejects.toThrow(BadRequestException);
//     });
//     it('/permissions (POST) - should not allow to create new permissions body is missing permission name', async () => {
//       const { accessToken: userToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, CREATE_PERMISSION, READ_PERMISSION],
//         true,
//       );

//       await expect(
//         createNewPermissionApi(app, userToken, [
//           { name: '', code: 'code', roleIds: [] },
//         ]),
//       ).rejects.toThrow(BadRequestException);
//     });
//     it('/permissions (POST) - should not allow to create new permissions when name is not unique', async () => {
//       const { accessToken: userToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, CREATE_PERMISSION, READ_PERMISSION],
//         true,
//       );

//       const unniqueValue = uuid();

//       await createNewPermissionApi(app, userToken, [
//         { name: unniqueValue, code: unniqueValue, roleIds: [] },
//       ]);

//       await expect(
//         createNewPermissionApi(app, userToken, [
//           { name: unniqueValue, code: `${unniqueValue}-1`, roleIds: [] },
//         ]),
//       ).rejects.toThrow(ConflictException);
//     });
//     it('/permissions (POST) - should not allow to create new permissions when code is not unique', async () => {
//       const { accessToken: userToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, CREATE_PERMISSION, READ_PERMISSION],
//         true,
//       );

//       const unniqueValue = uuid();
//       await createNewPermissionApi(app, userToken, [
//         { name: unniqueValue, code: unniqueValue, roleIds: [] },
//       ]);

//       await expect(
//         createNewPermissionApi(app, userToken, [
//           { name: `${unniqueValue}-1`, code: unniqueValue, roleIds: [] },
//         ]),
//       ).rejects.toThrow(ConflictException);
//     });
//   });

//   describe('/permissions (GET) find by Ids', () => {
//     it('/permissions (GET) - should retrieve permissions by ids', async () => {
//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, READ_PERMISSION],
//         true,
//       );

//       await findPermissionsByIdsApi(
//         app,
//         accessToken,
//         permissions.map((p) => p.id),
//       );
//     });
//     it('/permissions (GET) - should not retrieve permissions by ids because user was not verified', async () => {
//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, READ_PERMISSION],
//         false,
//       );

//       await expect(
//         findPermissionsByIdsApi(
//           app,
//           accessToken,
//           permissions.map((p) => p.id),
//         ),
//       ).rejects.toThrow(UnauthorizedException);
//     });
//     it('/permissions (GET) - should not retrieve permissions by ids because user does not have permission -> read role ', async () => {
//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION],
//         true,
//       );

//       await expect(
//         findPermissionsByIdsApi(
//           app,
//           accessToken,
//           permissions.map((p) => p.id),
//         ),
//       ).rejects.toThrow(ForbiddenException);
//     });
//     it('/permissions (GET) - should not retrieve permissions by ids because user does not have permission -> read permissions ', async () => {
//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE],
//         true,
//       );

//       await expect(
//         findPermissionsByIdsApi(
//           app,
//           accessToken,
//           permissions.map((p) => p.id),
//         ),
//       ).rejects.toThrow(ForbiddenException);
//     });
//     it('/permissions (GET) - should not retrieve permissions by ids because user is not authorized', async () => {
//       await expect(
//         findPermissionsByIdsApi(app, '', [uuid() as UUID]),
//       ).rejects.toThrow(UnauthorizedException);
//     });
//     it('/permissions (GET) - should not retrieve permissions by ids because ids are not found', async () => {
//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, READ_PERMISSION],
//         true,
//       );

//       await expect(
//         findPermissionsByIdsApi(app, accessToken, [uuid() as UUID]),
//       ).rejects.toThrow(EntityNotFoundError);
//     });
//     it('/permissions (GET) - should not retrieve permissions by ids because ids are not UUID', async () => {
//       const { accessToken: userToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, READ_PERMISSION],
//         true,
//       );

//       await request(httpServer)
//         .get('/permission/ids?ids=aaaa')
//         .set('Authorization', `Bearer ${userToken}`)
//         .expect(400);
//     });
//   });

//   describe('/permissions (GET) find by codes', () => {
//     it('/permissions (GET) - should retrieve permissions by codes', async () => {
//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, READ_PERMISSION],
//         true,
//       );

//       await findPermissionsByCodesApi(
//         app,
//         accessToken,
//         permissions.map((p) => p.code),
//         true,
//       );
//     });
//     it('/permissions (GET) - should not retrieve permissions by codes because user was not verified', async () => {
//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       const { accessToken: targetToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, READ_PERMISSION],
//         false,
//       );

//       await expect(
//         findPermissionsByCodesApi(
//           app,
//           targetToken,
//           permissions.map((p) => p.code),
//           true,
//         ),
//       ).rejects.toThrow(UnauthorizedException);
//     });
//     it('/permissions (GET) - should not retrieve permissions by codes because user does not have permission -> read role ', async () => {
//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       const { accessToken: targetToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION],
//         true,
//       );

//       await expect(
//         findPermissionsByCodesApi(
//           app,
//           targetToken,
//           permissions.map((p) => p.code),
//           true,
//         ),
//       ).rejects.toThrow(ForbiddenException);
//     });
//     it('/permissions (GET) - should not retrieve permissions by codes because user does not have permission -> read permissions ', async () => {
//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       const { accessToken: targetToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE],
//         true,
//       );

//       await expect(
//         findPermissionsByCodesApi(
//           app,
//           targetToken,
//           permissions.map((p) => p.code),
//           true,
//         ),
//       ).rejects.toThrow(ForbiddenException);
//     });
//     it('/permissions (GET) - should not retrieve permissions by codes because user is not authorized', async () => {
//       await expect(
//         findPermissionsByCodesApi(app, '', [uuid() as UUID], true),
//       ).rejects.toThrow(UnauthorizedException);
//     });
//     it('/permissions (GET) - should not retrieve permissions by codes because codes are not found', async () => {
//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, READ_PERMISSION],
//         true,
//       );

//       await expect(
//         findPermissionsByCodesApi(app, accessToken, [uuid() as UUID], true),
//       ).rejects.toThrow(EntityNotFoundError);
//     });
//     it('/permissions (GET) - should not retrieve permissions by codes because codes are not string', async () => {
//       const { accessToken: userToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_ROLE, READ_PERMISSION],
//         true,
//       );

//       await request(httpServer)
//         .get('/permission/codes?codes[0]={}&codes[1]=456')
//         .set('Authorization', `Bearer ${userToken}`)
//         .expect(400);
//     });
//   });
//   describe('/permissions (GET) search by value', () => {
//     it('/permissions (GET) - should search permissions by value', async () => {
//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION],
//         true,
//       );

//       if (permissions[0] === undefined) {
//         throw new Error('No permissions found to test search');
//       }

//       const partialValue = permissions[0].code.slice(0, 5);

//       await searchPermissionsByValueApi(app, accessToken, partialValue);
//     });
//     it('/permissions (GET) - should not search permissions by value because user was not verified', async () => {
//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION],
//         false,
//       );

//       if (permissions[0] === undefined) {
//         throw new Error('No permissions found to test search');
//       }

//       const partialValue = permissions[0].code.slice(0, 5);

//       await expect(
//         searchPermissionsByValueApi(app, accessToken, partialValue),
//       ).rejects.toThrow(UnauthorizedException);
//     });
//     it('/permissions (GET) - should not search permissions by value because user does not have permission -> read permissions', async () => {
//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       const { accessToken } = await initTestUser(app, systemToken, [], true);

//       if (permissions[0] === undefined) {
//         throw new Error('No permissions found to test search');
//       }

//       const partialValue = permissions[0].code.slice(0, 3);

//       await expect(
//         searchPermissionsByValueApi(app, accessToken, partialValue),
//       ).rejects.toThrow(ForbiddenException);
//     });
//     it('/permissions (GET) - should not retrieve permissions by codes because user is not authorized', async () => {
//       await expect(searchPermissionsByValueApi(app, '', '123')).rejects.toThrow(
//         UnauthorizedException,
//       );
//     });
//   });

//   describe('/permissions (PATCH)', () => {
//     it('/permissions (PATCH) - should update permission name and code', async () => {
//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION, UPDATE_PERMISSION],
//         true,
//       );

//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       if (permissions[0] === undefined) {
//         throw new Error('No permissions found to test update');
//       }

//       permissions[0].code = `${permissions[0].code}-updated`;
//       permissions[0].name = `${permissions[0].name}-updated`;

//       await updatePermissionsApi(
//         app,
//         accessToken,
//         { name: permissions[0].name, code: permissions[0].code },
//         permissions[0].id,
//       );
//     });
//     it('/permissions (PATCH) - should not update permission name and code because user was not verified', async () => {
//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION, UPDATE_PERMISSION],
//         false,
//       );

//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       if (permissions[0] === undefined) {
//         throw new Error('No permissions found to test update');
//       }

//       permissions[0].code = `${permissions[0].code}-updated`;
//       permissions[0].name = `${permissions[0].name}-updated`;

//       await expect(
//         updatePermissionsApi(
//           app,
//           accessToken,
//           { name: permissions[0].name, code: permissions[0].code },
//           permissions[0].id,
//         ),
//       ).rejects.toThrow(UnauthorizedException);
//     });
//     it('/permissions (PATCH) - should not update permission because is not authorized', async () => {
//       await expect(
//         updatePermissionsApi(
//           app,
//           '',
//           { name: 'zdfs', code: 'asdasd' },
//           uuid() as UUID,
//         ),
//       ).rejects.toThrow(UnauthorizedException);
//     });
//     it('/permissions (PATCH) - should not update permission because is user does not have required permission -> permission:read', async () => {
//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       if (permissions[0] === undefined) {
//         throw new Error('No permissions found to test update');
//       }

//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [UPDATE_PERMISSION],
//         true,
//       );

//       permissions[0].code = `${permissions[0].code}-updated`;
//       permissions[0].name = `${permissions[0].name}-updated`;

//       await expect(
//         updatePermissionsApi(
//           app,
//           accessToken,
//           { name: permissions[0].name, code: permissions[0].code },
//           permissions[0].id,
//         ),
//       ).rejects.toThrow(ForbiddenException);
//     });
//     it('/permissions (PATCH) - should not update permission because is user does not have required permission -> permission:update', async () => {
//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       if (permissions[0] === undefined) {
//         throw new Error('No permissions found to test update');
//       }

//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION],
//         true,
//       );

//       permissions[0].code = `${permissions[0].code}-updated`;
//       permissions[0].name = `${permissions[0].name}-updated`;

//       await expect(
//         updatePermissionsApi(
//           app,
//           accessToken,
//           { name: permissions[0].name, code: permissions[0].code },
//           permissions[0].id,
//         ),
//       ).rejects.toThrow(ForbiddenException);
//     });
//     it('/permissions (PATCH) - should not update permission because permission id does not exist', async () => {
//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION, UPDATE_PERMISSION],
//         true,
//       );

//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       if (permissions[0] === undefined) {
//         throw new Error('No permissions found to test update');
//       }

//       permissions[0].code = `${permissions[0].code}-updated`;
//       permissions[0].name = `${permissions[0].name}-updated`;

//       await expect(
//         updatePermissionsApi(
//           app,
//           accessToken,
//           { name: permissions[0].name, code: permissions[0].code },
//           uuid() as UUID,
//         ),
//       ).rejects.toThrow(EntityNotFoundError);
//     });
//     it('/permissions (PATCH) - should not update permission because permission name already exists', async () => {
//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION, UPDATE_PERMISSION],
//         true,
//       );

//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       if (permissions[0] === undefined || permissions[1] === undefined) {
//         throw new Error('No permissions found to test update');
//       }

//       permissions[1].code = `${permissions[1].code}-updated`;

//       await expect(
//         updatePermissionsApi(
//           app,
//           accessToken,
//           { name: permissions[0].name, code: permissions[1].code },
//           permissions[1].id,
//         ),
//       ).rejects.toThrow(ConflictException);
//     });
//     it('/permissions (PATCH) - should not update permission because permission code already exists', async () => {
//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION, UPDATE_PERMISSION],
//         true,
//       );

//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       if (permissions[0] === undefined || permissions[1] === undefined) {
//         throw new Error('No permissions found to test update');
//       }

//       permissions[1].name = `${permissions[1].name}-updated`;

//       await expect(
//         updatePermissionsApi(
//           app,
//           accessToken,
//           { name: permissions[1].name, code: permissions[0].code },
//           permissions[1].id,
//         ),
//       ).rejects.toThrow(ConflictException);
//     });
//   });

//   describe('/permissions (DELETE)', () => {
//     it('/permissions (DELETE) - should delete permission by ids', async () => {
//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION, DELETE_PERMISSION],
//         true,
//       );

//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       if (permissions[0] === undefined || permissions[1] === undefined) {
//         throw new Error('No permissions found to test delete');
//       }

//       const ids = permissions.map((p) => p.id);

//       await deletePermissionsApi(app, accessToken, ids);
//     });
//     it('/permissions (DELETE) - should not delete permission by ids because user was not verified', async () => {
//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION, DELETE_PERMISSION],
//         false,
//       );

//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       if (permissions[0] === undefined || permissions[1] === undefined) {
//         throw new Error('No permissions found to test delete');
//       }

//       const ids = permissions.map((p) => p.id);

//       await expect(deletePermissionsApi(app, accessToken, ids)).rejects.toThrow(
//         UnauthorizedException,
//       );
//     });
//     it('/permissions (DELETE) - should not delete permission by ids because user is not authorized', async () => {
//       await expect(
//         deletePermissionsApi(app, '', [uuid() as UUID]),
//       ).rejects.toThrow(UnauthorizedException);
//     });
//     it('/permissions (DELETE) - should not delete permission because is user does not have required permission -> permission:read', async () => {
//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [DELETE_PERMISSION],
//         true,
//       );

//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       if (permissions[0] === undefined || permissions[1] === undefined) {
//         throw new Error('No permissions found to test delete');
//       }

//       const ids = permissions.map((p) => p.id);

//       await expect(deletePermissionsApi(app, accessToken, ids)).rejects.toThrow(
//         ForbiddenException,
//       );
//     });
//     it('/permissions (DELETE) - should not delete permission because is user does not have required permission -> permission:delete', async () => {
//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION],
//         true,
//       );

//       const permissions = await generateNewPermissionsApi(app, systemToken);

//       if (permissions[0] === undefined || permissions[1] === undefined) {
//         throw new Error('No permissions found to test delete');
//       }

//       const ids = permissions.map((p) => p.id);

//       await expect(deletePermissionsApi(app, accessToken, ids)).rejects.toThrow(
//         ForbiddenException,
//       );
//     });
//     it('/permissions (DELETE) - should not delete permission because permission id was not found', async () => {
//       const { accessToken } = await initTestUser(
//         app,
//         systemToken,
//         [READ_PERMISSION, DELETE_PERMISSION],
//         true,
//       );

//       await expect(
//         deletePermissionsApi(app, accessToken, [uuid() as UUID]),
//       ).rejects.toThrow(EntityNotFoundError);
//     });
//   });
// });
