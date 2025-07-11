import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '@/department/dto/department.dto';
import { Department } from '@/department/entities/department.entity';
import { DEPARTMENT_QUERY_ALIAS } from '@/lib/const/department.const';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityNotFoundError, Repository } from 'typeorm';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}
  /**
   * Creates a new department with name uniqueness validation.
   *
   * Performs upfront name conflict detection to prevent duplicate departments
   * and maintain data integrity. Uses selective field querying for optimal
   * performance during validation checks.
   *
   * @param createDepartmentDto - Department creation data with validated fields
   * @returns Promise resolving to the created department entity
   * @throws ConflictException when department name already exists
   */
  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const existingDepartmentName = await this.departmentRepository
      .createQueryBuilder(DEPARTMENT_QUERY_ALIAS)
      .where(`${DEPARTMENT_QUERY_ALIAS}.name = :name`, {
        name: createDepartmentDto.name,
      })
      .select([`${DEPARTMENT_QUERY_ALIAS}.name`])
      .getOne();

    if (existingDepartmentName != undefined) {
      throw new ConflictException('Department with this name already exists');
    }

    // Entity creation with automatic field mapping and validation
    const department = this.departmentRepository.create(createDepartmentDto);

    return await this.departmentRepository.save(department);
  }

  /**
   * Retrieves a department by its unique identifier.
   *
   * @param ids - Unique identifiers of the departments
   * @returns Promise resolving to the department entity
   * @throws NotFoundException when department IDs doesn't exist
   */
  async findByIds(ids: UUID[]): Promise<Department[]> {
    const departments = await this.departmentRepository
      .createQueryBuilder(DEPARTMENT_QUERY_ALIAS)
      .where(`${DEPARTMENT_QUERY_ALIAS}.id IN (:...ids)`, { ids })
      .getMany();

    if (departments.length === 0) {
      throw new EntityNotFoundError(
        'Department',
        `Departments with IDs [${ids.join(', ')}] not found`,
      );
    }

    return departments;
  }

  /**
   * Searches for departments by name, country, or ID with pagination and sorting.
   *
   * Supports flexible search across multiple fields with pagination controls
   * to limit result set size and sorting options for consistent ordering.
   *
   * @param value - Search term to match against department name, country, or ID
   * @param pagination - Pagination parameters to control result set size
   * @param sort - Sorting parameters to order results by specified field
   * @returns Promise resolving to an array of matching department entities
   */
  async searchFor({
    value,
    pagination,
    sort,
  }: {
    value: string | number;
    pagination: PaginationDto;
    sort: SortDto;
  }): Promise<Department[]> {
    if (pagination.page < 1 || pagination.limit < 1) {
      throw new ConflictException(
        'Pagination parameters must be greater than 0',
      );
    }

    return await this.departmentRepository
      .createQueryBuilder(DEPARTMENT_QUERY_ALIAS)
      .where(`${DEPARTMENT_QUERY_ALIAS}.name like :value`, {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        value: `%${value}%`,
      })
      .where(`${DEPARTMENT_QUERY_ALIAS}.country like :value`, {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        value: `%${value}%`,
      })
      .orderBy(`${DEPARTMENT_QUERY_ALIAS}.${sort.sortField}`, sort.sortOrder)
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getMany();
  }

  /**
   * Updates an existing department with name uniqueness validation.
   *
   * Performs upfront name conflict detection to prevent duplicate departments
   * and maintain data integrity. Uses atomic update operation with parameterized query.
   *
   * @param id - Unique identifier of the department to update
   * @param updateDepartmentDto - Department update data with validated fields
   * @returns Promise resolving to the updated department entity
   * @throws NotFoundException when department ID doesn't exist
   * @throws ConflictException when department name already exists
   */
  async update(
    id: UUID,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    await this.findByIds([id]);

    if (updateDepartmentDto.name !== undefined) {
      const nameExists = await this.departmentRepository
        .createQueryBuilder(DEPARTMENT_QUERY_ALIAS)
        .where(
          `${DEPARTMENT_QUERY_ALIAS}.name = :name AND ${DEPARTMENT_QUERY_ALIAS}.id != :id`,
          {
            name: updateDepartmentDto.name,
            id,
          },
        )
        .getOne();

      if (nameExists) {
        throw new ConflictException(
          'Name is already in use by another department',
        );
      }
    }

    // Atomic update operation with parameterized query
    await this.departmentRepository
      .createQueryBuilder()
      .update(Department)
      .set(updateDepartmentDto)
      .where('id = :id', { id })
      .execute();

    return this.departmentRepository.findOneByOrFail({ id });
  }

  /**
   * Deletes departments by their IDs with comprehensive validation.
   *
   * Validates existence of all specified departments before deletion.
   * Throws NotFoundException if any department ID does not exist.
   *
   * @param ids - Array of department UUIDs to delete
   * @returns Promise resolving to the number of deleted departments
   * @throws NotFoundException when any specified department ID doesn't exist
   */
  async deleteByIds(ids: UUID[]): Promise<{ deleted: number }> {
    // Early return for empty input to avoid unnecessary database queries
    if (ids.length === 0) {
      return { deleted: 0 };
    }

    // Comprehensive existence validation before any deletion
    const existingDepartments = await this.findByIds(ids);

    // Fail-fast validation with detailed error reporting
    if (existingDepartments.length !== ids.length) {
      const missingIds = ids.filter(
        (id) => !existingDepartments.find((department) => department.id === id),
      );

      throw new EntityNotFoundError(
        'Department',
        `Departments with IDs [${missingIds.join(', ')}] not found`,
      );
    }

    // Atomic bulk deletion with affected row tracking
    const result = await this.departmentRepository
      .createQueryBuilder()
      .delete()
      .from(Department)
      .where('id IN (:...ids)', { ids })
      .execute();

    return { deleted: result.affected ?? 0 };
  }
}
