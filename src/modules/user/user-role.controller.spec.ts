import { READ_ROLE } from '@/lib/const/role.const';
import {
  CREATE_USER_ROLE,
  DELETE_USER_ROLE,
  READ_USER,
  READ_USER_ROLE,
} from '@/lib/const/user.const';
import { initTestUser, systemUserAuthToken } from '@/test/api/auth-user-api';
import { createNewUser } from '@/test/api/create-api-user';
import { createNewRoleApi } from '@/test/api/role-api';
import {
  assignRolesToUserById,
  createNewUserRole,
  findUserRolesApi,
  findUserRolesByEmailApi,
  unassignRolesFromUsersById,
} from '@/test/api/user-role-api';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import {
  ForbiddenException,
  type INestApplication,
  UnauthorizedException,
} from '@nestjs/common';

import type { UUID } from 'crypto';
import type { App } from 'supertest/types';
import { type DataSource, EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

describe('UserRoleController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let systemToken: string;
  const fakeUuid = uuid() as UUID;

  beforeAll(async () => {
    ({ app, dataSource } = await bootstrapTestApp());

    systemToken = await systemUserAuthToken(app);
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  describe('/userRoles (POST', () => {
    it('/department (POST) - should allow user to create new department', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await createNewUserRole(app, userToken, user.id, [role.id]);
    });

    it('/userRoles (POST) - should not allow user to create new userRoles because user access is not authorized', async () => {
      await expect(createNewUserRole(app, '', fakeUuid, [])).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('/userRoles (POST) - should not allow user to create new userRoles because missing required permissions', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [],
      );

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await expect(
        createNewUserRole(app, userToken, user.id, [role.id]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles (POST) - should not allow user to create new userRoles because missing required permission user-role:create', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await expect(
        createNewUserRole(app, userToken, user.id, [role.id]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles (POST) - should not allow user to create new userRoles because missing required permission user-role:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await expect(
        createNewUserRole(app, userToken, user.id, [role.id]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles (POST) - should not allow user to create new userRoles because missing required permission user:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER_ROLE,
        READ_ROLE,
      ]);

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await expect(
        createNewUserRole(app, userToken, user.id, [role.id]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles (POST) - should not allow user to create new userRoles because missing required permission role:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER_ROLE,
        READ_USER,
      ]);

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await expect(
        createNewUserRole(app, userToken, user.id, [role.id]),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('/userRoles (GET', () => {
    it('/userRoles (GET) - should retrieve userRoles by userId', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await createNewUserRole(app, userToken, user.id, [role.id]);

      await findUserRolesApi({
        app,
        accessToken: userToken,
        userIds: [user.id],
      });
    });

    it('/userRoles (GET) - should retrieve userRoles by roleId', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await createNewUserRole(app, userToken, user.id, [role.id]);

      await findUserRolesApi({
        app,
        accessToken: userToken,
        roleIds: [role.id],
      });
    });

    it('/userRoles (GET) - should retrieve userRoles by assignedByIds', async () => {
      const { accessToken: userToken, userId } = await initTestUser(
        app,
        systemToken,
        [CREATE_USER_ROLE, READ_USER_ROLE, READ_USER, READ_ROLE],
      );

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await createNewUserRole(app, userToken, user.id, [role.id]);

      await findUserRolesApi({
        app,
        accessToken: userToken,
        assignedByIds: [userId],
      });
    });

    it('/userRoles (GET) - should retrieve userRoles by userIds, roleIds and assignedByIds', async () => {
      const { accessToken: userToken, userId } = await initTestUser(
        app,
        systemToken,
        [CREATE_USER_ROLE, READ_USER_ROLE, READ_USER, READ_ROLE],
      );

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await createNewUserRole(app, userToken, user.id, [role.id]);

      await findUserRolesApi({
        app,
        accessToken: userToken,
        userIds: [user.id],
        roleIds: [role.id],
        assignedByIds: [userId],
      });
    });

    it('/userRoles (GET) - should not allow user to fetch userRoles because user access is not authorized', async () => {
      await expect(findUserRolesApi({ app, accessToken: '' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('/userRoles (GET) - should not allow user to fetch userRoles because missing required permissions', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [],
      );

      await expect(
        findUserRolesApi({ app, accessToken: userToken }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles (GET) - should not allow user to fetch userRoles because missing required permission user-role:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_USER,
        READ_ROLE,
      ]);

      await expect(
        findUserRolesApi({ app, accessToken: userToken }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles (GET) - should not allow user to fetch userRoles because missing required permission user:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_USER_ROLE,
        READ_ROLE,
      ]);

      await expect(
        findUserRolesApi({ app, accessToken: userToken }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles (GET) - should not allow user to fetch userRoles because missing required permission role:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_USER_ROLE,
        READ_USER,
      ]);
      await expect(
        findUserRolesApi({ app, accessToken: userToken }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles (GET) - should return empty array when no userRoles match the criteria', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      await expect(
        findUserRolesApi({
          app,
          accessToken: userToken,
          userIds: ['00000000-0000-0000-0000-000000000000'],
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('/userRoles by email (GET', () => {
    it('/userRoles (GET) - should retrieve userRoles by email', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await createNewUserRole(app, userToken, user.id, [role.id]);

      await findUserRolesByEmailApi({
        app,
        accessToken: userToken,
        email: user.email,
      });
    });

    it('/userRoles (GET) - should not allow user to fetch userRoles because user access is not authorized', async () => {
      await expect(
        findUserRolesByEmailApi({
          app,
          accessToken: '',
          email: 'test@gmail.com',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('/userRoles (GET) - should not allow user to fetch userRoles because missing required permissions', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [],
      );

      await expect(
        findUserRolesByEmailApi({
          app,
          accessToken: userToken,
          email: 'test@gmail.com',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles (GET) - should not allow user to fetch userRoles because missing required permission user-role:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_USER,
        READ_ROLE,
      ]);

      await expect(
        findUserRolesByEmailApi({
          app,
          accessToken: userToken,
          email: 'test@gmail.com',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles (GET) - should not allow user to fetch userRoles because missing required permission user:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_USER_ROLE,
        READ_ROLE,
      ]);

      await expect(
        findUserRolesByEmailApi({
          app,
          accessToken: userToken,
          email: 'test@gmail.com',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles (GET) - should not allow user to fetch userRoles because missing required permission role:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_USER_ROLE,
        READ_USER,
      ]);
      await expect(
        findUserRolesByEmailApi({
          app,
          accessToken: userToken,
          email: 'test@gmail.com',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles (GET) - should throw error if no userRoles were found by user email', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      await expect(
        findUserRolesByEmailApi({
          app,
          accessToken: userToken,
          email: '111aaa@qwe_test.com',
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('/userRoles/assign (POST', () => {
    it('/userRoles/assign/:userId (POST) - should allow user to assign roles to user', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await assignRolesToUserById(app, userToken, user.id, [role.id]);
    });

    it('/userRoles/assign/:userId (POST) - should not allow user to assign roles to user because user is not authorized', async () => {
      await expect(
        assignRolesToUserById(app, '', uuid() as UUID, [uuid() as UUID]),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('/userRoles/assign/:userId (POST) - should not allow user to assign roles to user because user does not have required permissions', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [],
      );

      await expect(
        assignRolesToUserById(app, userToken, uuid() as UUID, [uuid() as UUID]),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/userRoles/assign/:userId (POST) - should not allow user to assign roles to user because user does not have required permissions role:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER_ROLE,
        READ_USER,
      ]);

      await expect(
        assignRolesToUserById(app, userToken, uuid() as UUID, [uuid() as UUID]),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/userRoles/assign/:userId (POST) - should not allow user to assign roles to user because user does not have required permission user:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER_ROLE,
        READ_ROLE,
      ]);

      await expect(
        assignRolesToUserById(app, userToken, uuid() as UUID, [uuid() as UUID]),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/userRoles/assign/:userId (POST) - should not allow user to assign roles to user because user does not have required permission user-role:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      await expect(
        assignRolesToUserById(app, userToken, uuid() as UUID, [uuid() as UUID]),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/userRoles/assign/:userId (POST) - should not allow user to assign roles to user because user does not have required permission user-role:create', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      await expect(
        assignRolesToUserById(app, userToken, uuid() as UUID, [uuid() as UUID]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles/assign/:userId (POST) - should not allow user to assign roles to user bacause role id does not exist', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await expect(
        assignRolesToUserById(app, userToken, user.id, [role.id, fakeUuid]),
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('/userRoles/assign/:userId (POST) - should not allow user to assign roles to user bacause user id does not exist', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      const role = await createNewRoleApi(app, systemToken, undefined);

      await expect(
        assignRolesToUserById(app, userToken, fakeUuid, [role.id]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
  describe('/userRoles/unassign (POST', () => {
    it('/userRoles/unassign/:userId (POST) - should allow user to unassign roles to user by userId', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        DELETE_USER_ROLE,
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      const user = await createNewUser(app, [READ_ROLE], systemToken);

      const role = await createNewRoleApi(app, systemToken, undefined);
      await assignRolesToUserById(app, systemToken, user.id, [role.id]);

      await unassignRolesFromUsersById(app, userToken, [user.id], [role.id]);
    });

    it('/userRoles/unassign/:userId (POST) - should not allow user to unassign roles to user because user is not authorized', async () => {
      await expect(
        unassignRolesFromUsersById(app, '', [uuid() as UUID], [uuid() as UUID]),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('/userRoles/unassign/:userId (POST) - should not allow user to unassign roles to user because user does not have required permissions', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [],
      );

      await expect(
        unassignRolesFromUsersById(
          app,
          userToken,
          [uuid() as UUID],
          [uuid() as UUID],
        ),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/userRoles/unassign/:userId (POST) - should not allow user to unassign roles to user because user does not have required permissions role:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER_ROLE,
        READ_USER,
      ]);

      await expect(
        unassignRolesFromUsersById(
          app,
          userToken,
          [uuid() as UUID],
          [uuid() as UUID],
        ),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/userRoles/unassign/:userId (POST) - should not allow user to unassign roles to user because user does not have required permission user:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER_ROLE,
        READ_ROLE,
      ]);

      await expect(
        unassignRolesFromUsersById(
          app,
          userToken,
          [uuid() as UUID],
          [uuid() as UUID],
        ),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/userRoles/unassign/:userId (POST) - should not allow user to unassign roles to user because user does not have required permission user-role:read', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        CREATE_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      await expect(
        unassignRolesFromUsersById(
          app,
          userToken,
          [uuid() as UUID],
          [uuid() as UUID],
        ),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/userRoles/unassign/:userId (POST) - should not allow user to unassign roles to user because user does not have required permission user-role:create', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      await expect(
        unassignRolesFromUsersById(
          app,
          userToken,
          [uuid() as UUID],
          [uuid() as UUID],
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/userRoles/unassign/:userId (POST) - should not allow user to unassign roles to user bacause role id does not exist', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        DELETE_USER_ROLE,
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      const user = await createNewUser(app, [READ_ROLE], systemToken);
      const role = await createNewRoleApi(app, systemToken, undefined);

      await expect(
        unassignRolesFromUsersById(
          app,
          userToken,
          [user.id],
          [role.id, fakeUuid],
        ),
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('/userRoles/unassign/:userId (POST) - should not allow user to unassign roles to user bacause user id does not exist', async () => {
      const { accessToken: userToken } = await initTestUser(app, systemToken, [
        DELETE_USER_ROLE,
        READ_USER_ROLE,
        READ_USER,
        READ_ROLE,
      ]);

      const role = await createNewRoleApi(app, systemToken, undefined);

      await expect(
        unassignRolesFromUsersById(app, userToken, [fakeUuid], [role.id]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
