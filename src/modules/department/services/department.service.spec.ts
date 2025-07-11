import type { UpdateDepartmentDto } from '@/department/dto/department.dto';
import { DepartmentService } from '@/department/services/department.service';
import { createTestModule } from '@/test/db.connection';
import {
  createDepartment,
  deleteDepartments,
  findDepartmentsByIds,
  searchForDepartments,
  updateDepartmentCountry,
  updateDepartmentName,
} from '@/test/factories/department.factory';
import { ConflictException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import { EntityNotFoundError } from 'typeorm';
import { v4 as uuid } from 'uuid';

describe('DepartmentService (Integration - PostgreSQL)', () => {
  let module: TestingModule;
  let service: DepartmentService;

  beforeAll(async () => {
    const { module: testingModule } = await createTestModule();
    module = testingModule;
    service = module.get<DepartmentService>(DepartmentService);
  });

  afterAll(async () => {
    await module.close();
  });
  describe('create()', () => {
    it('should create and persist a department', async () => {
      await createDepartment(service);
    });

    it('should throw conflict error, because name already exists', async () => {
      const department = await createDepartment(service);

      await expect(
        service.create({ name: department.name, country: department.country }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByIds()', () => {
    it('should find departments by uuids', async () => {
      await findDepartmentsByIds(service);
    });

    it('should throw not found exception, because department id(s) does not exist', async () => {
      await expect(service.findByIds([uuid() as UUID])).rejects.toThrow(
        EntityNotFoundError,
      );
    });
  });
  describe('searchFor()', () => {
    it('should find departments by uuids', async () => {
      await searchForDepartments(service);
    });

    it('should throw not found exception, because department id(s) does not exist', async () => {
      await expect(service.findByIds([uuid() as UUID])).rejects.toThrow(
        EntityNotFoundError,
      );
    });
  });

  describe('update()', () => {
    it('should update departments name', async () => {
      await updateDepartmentName(service);
    });
    it('should update departments country', async () => {
      await updateDepartmentCountry(service);
    });

    it('should throw conflict exception, because department name already exist', async () => {
      const department1 = await createDepartment(service);
      const department2 = await createDepartment(service);

      const updateDto: UpdateDepartmentDto = {
        name: department1.name,
      };

      await expect(service.update(department2.id, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteByIds()', () => {
    it('should delete departments by ids and return count', async () => {
      await deleteDepartments(service);
    });

    it('should throw not found exception, because was made attempt to delete departments that does not exist', async () => {
      await expect(
        service.deleteByIds([uuid() as UUID, uuid() as UUID, uuid() as UUID]),
      ).rejects.toThrow(EntityNotFoundError);
    });
  });
});
