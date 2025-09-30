import {
  CREATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  READ_DEPARTMENT,
  UPDATE_DEPARTMENT,
} from '@/lib/const/department.const';
import { READ_USER } from '@/lib/const/user.const';
import { initTestUser, systemUserAuthToken } from '@/test/api/auth-user-api';
import {
  createNewDepartmentApi,
  deleteDepartmentApi,
  findDepartmentByIdsApi,
  queryDepartmentApi,
  searchDepartmentsByValueApi,
  updateDepartmentApi,
} from '@/test/api/department-api';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import {
  ConflictException,
  ForbiddenException,
  type INestApplication,
  UnauthorizedException,
} from '@nestjs/common';

import type { UUID } from 'crypto';
import type { App } from 'supertest/types';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

describe('DepartmentController', () => {
  let app: INestApplication<App>;
  let systemToken: string;

  beforeAll(async () => {
    ({ app } = await bootstrapTestApp());

    systemToken = await systemUserAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/department (POST)', () => {
    it('/department (POST) - should allow to create new department', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [CREATE_DEPARTMENT, READ_DEPARTMENT],
        true,
      );

      await createNewDepartmentApi(app, userToken);
    });

    it('/department (POST) - should not allow to create new department because user was not verified', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [CREATE_DEPARTMENT, READ_DEPARTMENT],
        false,
      );

      await expect(createNewDepartmentApi(app, userToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('/department (POST) - should not allow user to create new department because user access is not authorized', async () => {
      await expect(createNewDepartmentApi(app, '')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('/department (POST) - should not allow user to create new department because missing required permissions', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [],
        true,
      );

      await expect(createNewDepartmentApi(app, userToken)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/department (POST) - should not allow user to create new department because missing required permission read:department', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [CREATE_DEPARTMENT],
        true,
      );

      await expect(createNewDepartmentApi(app, userToken)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/department (POST) - should not allow user to create new department because missing required permission create:department', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        true,
      );

      await expect(createNewDepartmentApi(app, userToken)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('/department (POST) - should not allow user to create new department when name is not unique', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [CREATE_DEPARTMENT, READ_DEPARTMENT],
        true,
      );

      const department = await createNewDepartmentApi(app, userToken);

      await expect(
        createNewDepartmentApi(app, userToken, {
          name: department.name,
          country: department.country,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('/departments (GET) find by Ids', () => {
    it('/departments (GET) - should retrieve departments by ids', async () => {
      const department = await createNewDepartmentApi(app, systemToken);

      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        true,
      );

      await findDepartmentByIdsApi(app, targetToken, [department.id]);
    });
    it('/departments (GET) - should not retrieve departments by ids because user is not verified', async () => {
      const department = await createNewDepartmentApi(app, systemToken);

      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        false,
      );

      await expect(
        findDepartmentByIdsApi(app, targetToken, [department.id]),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/department (GET) - should not allow to retrieve departments because user access is not authorized', async () => {
      await expect(
        findDepartmentByIdsApi(app, '', [uuid() as UUID]),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('/department (GET) - should not allow to retrieve departments because missing required permissions', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [],
        true,
      );

      await expect(
        findDepartmentByIdsApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/department (GET) - should not allow to retrieve departments because missing required permission read:department', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [CREATE_DEPARTMENT],
        true,
      );

      await expect(
        findDepartmentByIdsApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/department (GET) - should not allow to retrieve departments because id is not found', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        true,
      );

      await expect(
        findDepartmentByIdsApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('/departments/query (GET) filter and query departments', () => {
    it('/departments/query (GET) - should retrieve departments by query filters ids', async () => {
      const department = await createNewDepartmentApi(app, systemToken);

      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        true,
      );

      await queryDepartmentApi(
        app,
        targetToken,
        {
          query: {
            ids: [department.id],
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        },
        false,
        1,
      );
    });

    it('/departments/query (GET) - should retrieve departments by query filters names', async () => {
      const department = await createNewDepartmentApi(app, systemToken);

      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        true,
      );

      await queryDepartmentApi(
        app,
        targetToken,
        {
          query: {
            names: [department.name],
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        },
        false,
        1,
      );
    });

    it('/departments/query (GET) - should retrieve departments by query filters countries', async () => {
      const department = await createNewDepartmentApi(app, systemToken);

      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        true,
      );

      await queryDepartmentApi(
        app,
        targetToken,
        {
          query: {
            countries: [department.country],
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        },
        false,
      );
    });

    it('/departments/query (GET) - should retrieve departments by query filters createdByids', async () => {
      const { accessToken: userToken, userId } = await initTestUser(
        app,
        systemToken,
        [CREATE_DEPARTMENT, READ_DEPARTMENT, READ_USER],
        true,
      );

      await createNewDepartmentApi(app, userToken);

      await queryDepartmentApi(
        app,
        userToken,
        {
          query: {
            createdByUserIds: [userId],
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        },
        true,
      );
    });

    it('/departments/query (GET) - should retrieve departments by query filters ids and name', async () => {
      const departments = [
        await createNewDepartmentApi(app, systemToken),
        await createNewDepartmentApi(app, systemToken),
      ];

      const ids = departments.map((d) => d.id);
      const names = departments.map((d) => d.name);

      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        true,
      );

      await queryDepartmentApi(
        app,
        targetToken,
        {
          query: {
            ids,
            names,
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        },
        false,
        2,
      );
    });
    it('/departments/query (GET) - should retrieve departments by query filters ids, name, countries', async () => {
      const departments = [
        await createNewDepartmentApi(app, systemToken),
        await createNewDepartmentApi(app, systemToken),
        await createNewDepartmentApi(app, systemToken),
      ];

      const ids = departments.map((d) => d.id);
      const names = departments.map((d) => d.name);
      const countries = departments.map((d) => d.country);

      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        true,
      );

      await queryDepartmentApi(
        app,
        targetToken,
        {
          query: {
            ids,
            names,
            countries,
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        },
        false,
        3,
      );
    });
    it('/departments/query (GET) - should retrieve departments by query filters ids, name, countries, createdByUserIds', async () => {
      const { accessToken: userToken, userId } = await initTestUser(
        app,
        systemToken,
        [CREATE_DEPARTMENT, READ_DEPARTMENT, READ_USER],
        true,
      );

      const departments = [
        await createNewDepartmentApi(app, userToken),
        await createNewDepartmentApi(app, userToken),
        await createNewDepartmentApi(app, userToken),
        await createNewDepartmentApi(app, userToken),
      ];

      const ids = departments.map((d) => d.id);
      const names = departments.map((d) => d.name);
      const countries = departments.map((d) => d.country);

      await queryDepartmentApi(
        app,
        userToken,
        {
          query: {
            ids,
            names,
            countries,
            createdByUserIds: [userId],
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        },
        true,
        4,
      );
    });

    it('/departments/query (GET) - should not retrieve departments by query because user is not verified', async () => {
      const department = await createNewDepartmentApi(app, systemToken);

      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        false,
      );

      await expect(
        queryDepartmentApi(
          app,
          targetToken,
          {
            query: {
              ids: [department.id],
            },
            pagination: {
              page: 1,
              limit: 10,
            },
          },
          false,
          0,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('/departments/query (GET) - should not allow to retrieve departments because user access is not authorized', async () => {
      await expect(
        queryDepartmentApi(
          app,
          '',
          {
            query: {
              ids: [uuid() as UUID],
            },
            pagination: {
              page: 1,
              limit: 10,
            },
          },
          false,
          0,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('/departments/query (GET) - should not allow to retrieve departments because missing required permissions', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [],
        true,
      );

      await expect(
        queryDepartmentApi(
          app,
          userToken,
          {
            query: {
              ids: [uuid() as UUID],
            },
            pagination: {
              page: 1,
              limit: 10,
            },
          },
          false,
          0,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/departments/query (GET) - should not allow to retrieve departments because missing required permission read:department', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [CREATE_DEPARTMENT],
        true,
      );

      await expect(
        queryDepartmentApi(
          app,
          userToken,
          {
            query: {
              ids: [uuid() as UUID],
            },
            pagination: {
              page: 1,
              limit: 10,
            },
          },
          false,
          0,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('/departments/query (GET) - should retrieve no departments because ids not found', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        true,
      );

      await queryDepartmentApi(
        app,
        userToken,
        {
          query: {
            ids: [uuid() as UUID],
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        },
        true,
        0,
      );
    });
  });

  describe('/departments (GET) search by value', () => {
    it('/departments (GET) - should search for departments by ids', async () => {
      await createNewDepartmentApi(app, systemToken);

      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        true,
      );

      await searchDepartmentsByValueApi(app, targetToken, 'a');
    });

    it('/departments (GET) - should search for departments by ids', async () => {
      await createNewDepartmentApi(app, systemToken);

      const { accessToken: targetToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        false,
      );

      await expect(
        searchDepartmentsByValueApi(app, targetToken, 'a'),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/department (GET) - should not allow user to search for departments because user access is not authorized', async () => {
      await expect(searchDepartmentsByValueApi(app, '', 'aaa')).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('/department (GET) - should not allow user to search for departments because missing required permissions', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [],
        true,
      );

      await expect(
        searchDepartmentsByValueApi(app, userToken, 'aaa'),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/department (GET) - should not allow user to search for departments because missing required permission read:department', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [CREATE_DEPARTMENT],
        true,
      );

      await expect(
        searchDepartmentsByValueApi(app, userToken, 'aaa'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('/departments (PATCH)', () => {
    it('/departments (PATCH) - should update department', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [UPDATE_DEPARTMENT, READ_DEPARTMENT],
        true,
      );

      const department = await createNewDepartmentApi(app, systemToken);

      await updateDepartmentApi(
        app,
        userToken,
        {
          name: `${department.name} - Updated`,
          country: 'Updated Country',
        },
        department.id,
      );
    });
    it('/departments (PATCH) - should not update department because user was not verified', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [UPDATE_DEPARTMENT, READ_DEPARTMENT],
        false,
      );

      const department = await createNewDepartmentApi(app, systemToken);

      await expect(
        updateDepartmentApi(
          app,
          userToken,
          {
            name: `${department.name} - Updated`,
            country: 'Updated Country',
          },
          department.id,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/department (PATCH) - should not allow to update department because user is not authorized', async () => {
      await expect(
        updateDepartmentApi(app, '', { name: '123' }, uuid() as UUID),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/department (PATCH) - should not allow user to update department because user does not have required permission read:department', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [UPDATE_DEPARTMENT],
        true,
      );

      await expect(
        updateDepartmentApi(app, userToken, { name: '123' }, uuid() as UUID),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/department (PATCH) - should not allow user to update department because user does not have required permission update:department', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        true,
      );

      await expect(
        updateDepartmentApi(app, userToken, { name: '123' }, uuid() as UUID),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/department (PATCH) - should not allow user to update department because id is not found', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT, UPDATE_DEPARTMENT],
        true,
      );

      await expect(
        updateDepartmentApi(app, userToken, { name: '123' }, uuid() as UUID),
      ).rejects.toThrow(EntityNotFoundError);
    });
    it('/department (PATCH) - should not allow user to update department because name already exists', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT, UPDATE_DEPARTMENT],
        true,
      );

      const department = await createNewDepartmentApi(app, systemToken);

      const anotherDepartment = await createNewDepartmentApi(app, systemToken);

      await expect(
        updateDepartmentApi(
          app,
          userToken,
          { name: anotherDepartment.name },
          department.id,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('/departments (DELETE)', () => {
    it('/departments (DELETE) - should delete departments by ids', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [DELETE_DEPARTMENT, READ_DEPARTMENT],
        true,
      );

      const department = await createNewDepartmentApi(app, systemToken);

      await deleteDepartmentApi(app, userToken, [department.id]);
    });
    it('/departments (DELETE) - should not delete departments by ids because user was not verified', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [DELETE_DEPARTMENT, READ_DEPARTMENT],
        false,
      );

      const department = await createNewDepartmentApi(app, systemToken);

      await expect(
        deleteDepartmentApi(app, userToken, [department.id]),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/departments (DELETE) - should not delete departments because user is not authorized', async () => {
      await expect(
        deleteDepartmentApi(app, '', [uuid() as UUID]),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/departments (DELETE) - should not delete departments because user does not have required permission read:department', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [DELETE_DEPARTMENT],
        true,
      );
      await expect(
        deleteDepartmentApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/departments (DELETE) - should not delete departments because user does not have required permission delete:department', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT],
        true,
      );
      await expect(
        deleteDepartmentApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/departments (DELETE) - should not delete departments because id is not found', async () => {
      const { accessToken: userToken } = await initTestUser(
        app,
        systemToken,
        [READ_DEPARTMENT, DELETE_DEPARTMENT],
        true,
      );

      await expect(
        deleteDepartmentApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
