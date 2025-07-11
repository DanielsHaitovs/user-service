import type {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '@/department/dto/department.dto';
import type { Department } from '@/department/entities/department.entity';
import type { DepartmentService } from '@/department/services/department.service';
import { getRandomCountryCode } from '@/lib/helper/country.helper';
import { faker } from '@faker-js/faker/.';
import { NotFoundException } from '@nestjs/common';

import { v4 as uuid } from 'uuid';

export async function createDepartment(
  service: DepartmentService,
): Promise<Department> {
  const dto: CreateDepartmentDto = {
    name: `${faker.lorem.word()}-${uuid()}`,
    country: getRandomCountryCode(),
  };

  const result = await service.create(dto);

  expect(result).toBeDefined();
  expect(result.id).toBeDefined();
  expect(result.name).toBe(dto.name);
  expect(result.country).toBe(dto.country);

  return result;
}

export async function findDepartmentsByIds(
  service: DepartmentService,
): Promise<Department[]> {
  const department = await createDepartment(service);

  const departments = await service.findByIds([department.id]);

  expect(departments).toBeDefined();
  expect(Array.isArray(departments)).toBe(true);
  expect(departments).toHaveLength(1);
  expect(departments[0]?.name).toBe(department.name);
  expect(departments[0]?.country).toBe(department.country);

  return departments;
}

export async function searchForDepartments(
  service: DepartmentService,
): Promise<Department[]> {
  return await service.searchFor({
    value: faker.lorem.word(),
    pagination: {
      limit: 20,
      page: 1,
    },
    sort: { sortField: 'createdAt', sortOrder: 'ASC' },
  });
}

export async function updateDepartmentName(
  service: DepartmentService,
): Promise<Department> {
  const department = await createDepartment(service);

  const updateDto: UpdateDepartmentDto = {
    name: `from-${department.id}-to-${faker.lorem.word()}`,
  };

  const updatedDepartment = await service.update(department.id, updateDto);

  expect(updatedDepartment).toBeDefined();
  expect(updatedDepartment.id).toBeDefined();
  expect(updatedDepartment.name).toBe(updateDto.name);
  expect(updatedDepartment.country).toBe(department.country);

  return updatedDepartment;
}

export async function updateDepartmentCountry(
  service: DepartmentService,
): Promise<Department> {
  const department = await createDepartment(service);

  const updateDto: UpdateDepartmentDto = {
    country: getRandomCountryCode(),
  };

  const updatedDepartment = await service.update(department.id, updateDto);

  expect(updatedDepartment).toBeDefined();
  expect(updatedDepartment.id).toBeDefined();
  expect(updatedDepartment.name).toBe(department.name);
  expect(updatedDepartment.country).toBe(updateDto.country);

  return updatedDepartment;
}

export async function deleteDepartments(
  service: DepartmentService,
): Promise<void> {
  const department = await createDepartment(service);

  const result = await service.deleteByIds([department.id]);

  expect(result).toEqual({ deleted: 1 });

  await expect(service.findByIds([department.id])).rejects.toThrow(
    NotFoundException,
  );
}
