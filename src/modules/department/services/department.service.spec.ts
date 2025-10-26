import type { UpdateDepartmentDto } from '@/department/dto/department.dto';
import { DepartmentService } from '@/department/services/department.service';
import { DepartmentQueryService } from '@/department/services/query.service';
import { getSystemUserId } from '@/test/api/auth-user-api';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import {
  createDepartment,
  deleteDepartments,
  findDepartmentsByIds,
  queryDepartments,
  searchForDepartments,
  updateDepartmentCountry,
  updateDepartmentName,
} from '@/test/factories/department.factory';
import { ConflictException, type INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import type { App } from 'supertest/types';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

describe('DepartmentService (Integration - PostgreSQL)', () => {
  let app: INestApplication<App>;
  let module: TestingModule;
  let service: DepartmentService;
  let queryService: DepartmentQueryService;
  let systemUserId: UUID;

  beforeAll(async () => {
    ({ moduleFixture: module, app } = await bootstrapTestApp());

    service = module.get<DepartmentService>(DepartmentService);
    queryService = module.get<DepartmentQueryService>(DepartmentQueryService);
    systemUserId = await getSystemUserId(app);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('create()', () => {
    it('should create and persist a department', async () => {
      await createDepartment(service, systemUserId, false);
    });

    it('should create and persist a department with access to user', async () => {
      await createDepartment(service, systemUserId, true);
    });

    it('should throw conflict error, because name already exists', async () => {
      const department = await createDepartment(service, systemUserId, false);

      await expect(
        service.create({
          createDepartmentDto: {
            name: department.name,
            country: department.country,
          },
          createdBy: systemUserId,
          hasAccessToUser: false,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByIds()', () => {
    it('should find departments by uuids', async () => {
      await findDepartmentsByIds(service, systemUserId, false);
    });

    it('should find departments by uuids with access to users', async () => {
      await findDepartmentsByIds(service, systemUserId, true);
    });

    it('should throw not found exception, because department id(s) does not exist', async () => {
      await expect(
        service.findByIds({
          ids: [uuid() as UUID],
          pagination: { page: 1, limit: 1 },
          hasAccessToUser: false,
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
  describe('query()', () => {
    it('should query departments', async () => {
      await queryDepartments(service, queryService, systemUserId, false);
    });

    it('should query departments with access to users', async () => {
      await queryDepartments(service, queryService, systemUserId, true);
    });

    it('should return empty array because department does not exist', async () => {
      await expect(
        queryService.getDepartements(
          {
            query: {
              ids: [uuid() as UUID, uuid() as UUID],
            },
            pagination: {
              page: 1,
              limit: 20,
            },
          },
          true,
        ),
      ).resolves.toHaveProperty('departments', []);
    });
  });

  describe('searchFor()', () => {
    it('should find departments by uuids with access to users', async () => {
      await searchForDepartments(service, systemUserId, false);
    });

    it('should find departments by uuids', async () => {
      await searchForDepartments(service, systemUserId, true);
    });

    it('should throw not found exception, because department id(s) does not exist', async () => {
      await expect(
        service.findByIds({
          ids: [uuid() as UUID],
          pagination: { page: 1, limit: 1 },
          hasAccessToUser: false,
        }),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('update()', () => {
    it('should update departments name', async () => {
      await updateDepartmentName(service, systemUserId);
    });
    it('should update departments country', async () => {
      await updateDepartmentCountry(service, systemUserId);
    });

    it('should throw conflict exception, because department name already exist', async () => {
      const department1 = await createDepartment(service, systemUserId, false);
      const department2 = await createDepartment(service, systemUserId, false);

      const updateDto: UpdateDepartmentDto = {
        name: department1.name,
      };

      await expect(
        service.update({ id: department2.id, updateDepartmentDto: updateDto }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteByIds()', () => {
    it('should delete departments by ids and return count', async () => {
      await deleteDepartments(service, systemUserId);
    });

    it('should throw not found exception, because was made attempt to delete departments that does not exist', async () => {
      await expect(
        service.deleteByIds([uuid() as UUID, uuid() as UUID, uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
