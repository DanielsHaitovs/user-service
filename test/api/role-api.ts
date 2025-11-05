// import type {
//   CreateRoleDto,
//   RoleListResponseDto,
//   UpdateRoleDto,
// } from '@/role/dto/role.dto';
// import type { Role } from '@/role/entities/role.entity';
// import { validateResponse } from '@/test/validation/request';
// import { validateRoleApiResponse } from '@/test/validation/role';
// import { faker } from '@faker-js/faker';
// import type { INestApplication } from '@nestjs/common';

// import type { UUID } from 'crypto';
// import type { Server } from 'http';
// import * as request from 'supertest';
// import { v4 as uuid } from 'uuid';

// export async function createNewRoleApi(
//   app: INestApplication,
//   accessToken: string,
//   dto: CreateRoleDto | undefined,
// ): Promise<Role> {
//   const httpServer = app.getHttpServer() as Server;

//   dto ??= {
//     name: `${faker.lorem.word()}-${uuid()}`,
//   };

//   const response = await request(httpServer)
//     .post('/roles')
//     .set('Authorization', `Bearer ${accessToken}`)
//     .send(dto);

//   validateResponse({ response, alias: 'Role' });

//   const role = response.body as Role;

//   validateRoleApiResponse({
//     roles: [role],
//     names: [dto.name],
//     amountExpected: 1,
//   });

//   return role;
// }

// export async function addPermissionsToRoleApi(
//   app: INestApplication,
//   accessToken: string,
//   roleId: UUID,
//   permissionIds: UUID[],
// ): Promise<Role> {
//   const httpServer = app.getHttpServer() as Server;

//   const response = await request(httpServer)
//     .post('/roles/add-permissions')
//     .set('Authorization', `Bearer ${accessToken}`)
//     .send({
//       permissionIds,
//       roleId,
//     });

//   validateResponse({ response, alias: 'Role' });

//   const role = response.body as Role;

//   validateRoleApiResponse({
//     roles: [role],
//     ids: [roleId],
//     amountExpected: 1,
//     permissionIds,
//   });

//   return role;
// }

// export async function findRolesByIdsApi(
//   app: INestApplication,
//   accessToken: string,
//   ids: UUID[],
// ): Promise<Role[]> {
//   const httpServer = app.getHttpServer() as Server;

//   const roleQuery = ids.map((p) => `ids=${p}`).join('&');

//   const response = await request(httpServer)
//     .get(
//       `/roles/attributes/ids?${roleQuery}&page=1&limit=${ids.length.toString()}`,
//     )
//     .set('Authorization', `Bearer ${accessToken}`);

//   validateResponse({ response, alias: 'Role' });

//   const roles = response.body as Role[];

//   validateRoleApiResponse({
//     roles,
//     ids,
//     amountExpected: ids.length,
//   });

//   return roles;
// }

// export async function searchRolesByValueApi(
//   app: INestApplication,
//   accessToken: string,
//   value: string,
// ): Promise<RoleListResponseDto> {
//   const httpServer = app.getHttpServer() as Server;

//   const response = await request(httpServer)
//     .get(`/roles/attributes/${value}?page=1&limit=10`)
//     .set('Authorization', `Bearer ${accessToken}`);

//   validateResponse({ response, alias: 'Role' });

//   const { roles } = response.body as RoleListResponseDto;

//   validateRoleApiResponse({
//     roles,
//   });

//   return response.body as RoleListResponseDto;
// }

// export async function updateRoleApi(
//   app: INestApplication,
//   accessToken: string,
//   role: UpdateRoleDto,
//   id: UUID,
// ): Promise<Role> {
//   const httpServer = app.getHttpServer() as Server;

//   const response = await request(httpServer)
//     .patch(`/roles/${id}`)
//     .set('Authorization', `Bearer ${accessToken}`)
//     .send(role);

//   validateResponse({ response, alias: 'Role' });

//   const updatedRole = response.body as Role;

//   validateRoleApiResponse({
//     roles: [updatedRole],
//     ids: [id],
//     amountExpected: 1,
//     ...(role.name !== undefined && { names: [role.name] }),
//   });

//   return updatedRole;
// }

// export async function deleteRolesApi(
//   app: INestApplication,
//   accessToken: string,
//   ids: UUID[],
// ): Promise<{ deleted: number }> {
//   const httpServer = app.getHttpServer() as Server;

//   const roleQuery = ids.map((p) => `ids=${p}`).join('&');

//   const response = await request(httpServer)
//     .delete(`/roles?${roleQuery}`)
//     .set('Authorization', `Bearer ${accessToken}`);

//   validateResponse({ response, alias: 'Role' });

//   const role = response.body as { deleted: number };

//   expect(role).toBeDefined();
//   expect(role.deleted).toBeDefined();
//   expect(role.deleted).toBe(ids.length);

//   return role;
// }
