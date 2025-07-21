import { EntityNotFoundFilter } from '@/common/error/entity-not-found.filter';
import {
  CREATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  READ_DEPARTMENT,
  UPDATE_DEPARTMENT,
} from '@/lib/const/department.const';
import { createTestModule } from '@/test/db.connection';
import { initTestUser } from '@/test/helper/auth-user-api';
import { systemUserAuthToken } from '@/test/helper/create-api-user';
import {
  createNewDepartmentApi,
  deleteDepartmentApi,
  findDepartmentByIdApi,
  searchDepartmentsByValueApi,
  updateDepartmentApi,
  validateDepartmentsApiResponse,
} from '@/test/helper/department-api';
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
    const { module } = await createTestModule();
    app = module.createNestApplication();
    app.useGlobalFilters(new EntityNotFoundFilter());

    await app.init();

    systemToken = await systemUserAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/department (POST)', () => {
    it('/department (POST) - should allow user to create new department', async () => {
      const userToken = await initTestUser(app, systemToken, [
        CREATE_DEPARTMENT,
        READ_DEPARTMENT,
      ]);

      const department = await createNewDepartmentApi(app, userToken);

      validateDepartmentsApiResponse([department]);
    });

    it('/department (POST) - should not allow user to create new department because user access is not authorized', async () => {
      await expect(createNewDepartmentApi(app, '')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('/department (POST) - should not allow user to create new department because missing required permissions', async () => {
      const userToken = await initTestUser(app, systemToken, []);

      await expect(createNewDepartmentApi(app, userToken)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/department (POST) - should not allow user to create new department because missing required permission read:department', async () => {
      const userToken = await initTestUser(app, systemToken, [
        CREATE_DEPARTMENT,
      ]);

      await expect(createNewDepartmentApi(app, userToken)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('/department (POST) - should not allow user to create new department because missing required permission create:department', async () => {
      const userToken = await initTestUser(app, systemToken, [READ_DEPARTMENT]);

      await expect(createNewDepartmentApi(app, userToken)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('/department (POST) - should not allow user to create new department when name is not unique', async () => {
      const userToken = await initTestUser(app, systemToken, [
        CREATE_DEPARTMENT,
        READ_DEPARTMENT,
      ]);

      const department = await createNewDepartmentApi(app, userToken);

      validateDepartmentsApiResponse([department]);

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

      validateDepartmentsApiResponse([department]);

      const targetToken = await initTestUser(app, systemToken, [
        READ_DEPARTMENT,
      ]);

      const foundDepartments = await findDepartmentByIdApi(
        app,
        targetToken,
        department.id,
      );

      validateDepartmentsApiResponse(foundDepartments);
    });
    it('/department (GET) - should not allow user to retrieve departments because user access is not authorized', async () => {
      await expect(
        findDepartmentByIdApi(app, '', uuid() as UUID),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('/department (GET) - should not allow user to retrieve departments because missing required permissions', async () => {
      const userToken = await initTestUser(app, systemToken, []);

      await expect(
        findDepartmentByIdApi(app, userToken, uuid() as UUID),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/department (GET) - should not allow user to retrieve departments because missing required permission read:department', async () => {
      const userToken = await initTestUser(app, systemToken, [
        CREATE_DEPARTMENT,
      ]);

      await expect(
        findDepartmentByIdApi(app, userToken, uuid() as UUID),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/department (GET) - should not allow user to retrieve departments because id is not found', async () => {
      const userToken = await initTestUser(app, systemToken, [READ_DEPARTMENT]);

      await expect(
        findDepartmentByIdApi(app, userToken, uuid() as UUID),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
  describe('/departments (GET) search by value', () => {
    it('/departments (GET) - should search for departments by ids', async () => {
      const department = await createNewDepartmentApi(app, systemToken);

      validateDepartmentsApiResponse([department]);

      const targetToken = await initTestUser(app, systemToken, [
        READ_DEPARTMENT,
      ]);

      const { departments } = await searchDepartmentsByValueApi(
        app,
        targetToken,
        'a',
      );

      validateDepartmentsApiResponse(departments);
    });
    it('/department (GET) - should not allow user to search for departments because user access is not authorized', async () => {
      await expect(searchDepartmentsByValueApi(app, '', 'aaa')).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('/department (GET) - should not allow user to search for departments because missing required permissions', async () => {
      const userToken = await initTestUser(app, systemToken, []);

      await expect(
        searchDepartmentsByValueApi(app, userToken, 'aaa'),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/department (GET) - should not allow user to search for departments because missing required permission read:department', async () => {
      const userToken = await initTestUser(app, systemToken, [
        CREATE_DEPARTMENT,
      ]);

      await expect(
        searchDepartmentsByValueApi(app, userToken, 'aaa'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
  describe('/departments (PATCH)', () => {
    it('/departments (PATCH) - should update department', async () => {
      const userToken = await initTestUser(app, systemToken, [
        UPDATE_DEPARTMENT,
        READ_DEPARTMENT,
      ]);

      const department = await createNewDepartmentApi(app, systemToken);

      validateDepartmentsApiResponse([department]);

      const updatedDepartment = await updateDepartmentApi(
        app,
        userToken,
        {
          name: `${department.name} - Updated`,
          country: 'Updated Country',
        },
        department.id,
      );

      validateDepartmentsApiResponse([updatedDepartment]);
    });
    it('/department (PATCH) - should not allow user to update department because user is not authorized', async () => {
      await expect(
        updateDepartmentApi(app, '', { name: '123' }, uuid() as UUID),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/department (PATCH) - should not allow user to update department because user does not have required permission read:department', async () => {
      const userToken = await initTestUser(app, systemToken, [
        UPDATE_DEPARTMENT,
      ]);

      await expect(
        updateDepartmentApi(app, userToken, { name: '123' }, uuid() as UUID),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/department (PATCH) - should not allow user to update department because user does not have required permission update:department', async () => {
      const userToken = await initTestUser(app, systemToken, [READ_DEPARTMENT]);

      await expect(
        updateDepartmentApi(app, userToken, { name: '123' }, uuid() as UUID),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/department (PATCH) - should not allow user to update department because id is not found', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_DEPARTMENT,
        UPDATE_DEPARTMENT,
      ]);

      await expect(
        updateDepartmentApi(app, userToken, { name: '123' }, uuid() as UUID),
      ).rejects.toThrow(EntityNotFoundError);
    });
    it('/department (PATCH) - should not allow user to update department because name already exists', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_DEPARTMENT,
        UPDATE_DEPARTMENT,
      ]);

      const department = await createNewDepartmentApi(app, systemToken);
      validateDepartmentsApiResponse([department]);

      const anotherDepartment = await createNewDepartmentApi(app, systemToken);

      validateDepartmentsApiResponse([anotherDepartment]);

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
      const userToken = await initTestUser(app, systemToken, [
        DELETE_DEPARTMENT,
        READ_DEPARTMENT,
      ]);

      const department = await createNewDepartmentApi(app, systemToken);

      validateDepartmentsApiResponse([department]);

      const deletedDepartments = await deleteDepartmentApi(app, userToken, [
        department.id,
      ]);

      expect(deletedDepartments).toBeDefined();
      expect(deletedDepartments.deleted).toBe(1);
    });
    it('/departments (DELETE) - should not delete departments because user is not authorized', async () => {
      await expect(
        deleteDepartmentApi(app, '', [uuid() as UUID]),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('/departments (DELETE) - should not delete departments because user does not have required permission read:department', async () => {
      const userToken = await initTestUser(app, systemToken, [
        DELETE_DEPARTMENT,
      ]);
      await expect(
        deleteDepartmentApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/departments (DELETE) - should not delete departments because user does not have required permission delete:department', async () => {
      const userToken = await initTestUser(app, systemToken, [READ_DEPARTMENT]);
      await expect(
        deleteDepartmentApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(ForbiddenException);
    });
    it('/departments (DELETE) - should not delete departments because id is not found', async () => {
      const userToken = await initTestUser(app, systemToken, [
        READ_DEPARTMENT,
        DELETE_DEPARTMENT,
      ]);

      await expect(
        deleteDepartmentApi(app, userToken, [uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
