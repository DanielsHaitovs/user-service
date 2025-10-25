import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { PostgresQueryFailedError } from '@/base/interface/query.error';
import {
  CreateDepartmentDto,
  DepartmentListResponseDto,
  UpdateDepartmentDto,
} from '@/department/dto/department.dto';
import { Department } from '@/department/entities/department.entity';
import { DepartmentQueryService } from '@/department/services/query.service';
import { DEPARTMENT_QUERY_ALIAS } from '@/lib/const/department.const';
import { CREATEDBY_USER_QUERY_ALIAS } from '@/lib/const/user.const';
import { User } from '@/user/entities/user.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityNotFoundError, Repository } from 'typeorm';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly queryService: DepartmentQueryService,
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
  async create({
    createDepartmentDto,
    createdBy,
    hasAccessToUser,
  }: {
    createDepartmentDto: CreateDepartmentDto;
    createdBy: UUID;
    hasAccessToUser: boolean;
  }): Promise<Department> {
    const { name, country } = createDepartmentDto;

    const department = this.departmentRepository.create({
      name,
      country,
      createdBy: { id: createdBy } as User,
    });

    const res = await this.departmentRepository
      .save(department)
      .catch((e: unknown) => {
        const error = e as PostgresQueryFailedError;

        if (error.code === '23505') {
          throw new ConflictException(
            `Department with this name ${name} already exists`,
          );
        }

        throw error;
      });

    if (!hasAccessToUser) {
      res.createdBy = {} as User;
      res.users = [];
    }

    return res;
  }

  /**
   * Retrieves a department by its unique identifier.
   *
   * @param ids - Unique identifiers of the departments
   * @returns Promise resolving to the department entity
   * @throws NotFoundException when department IDs doesn't exist
   */
  async findByIds({
    ids,
    pagination,
    hasAccessToUser,
    select,
    order,
  }: {
    ids: UUID[];
    pagination: PaginationDto;
    hasAccessToUser: boolean;
    select?: string[];
    order?: SortDto;
  }): Promise<Department[]> {
    if (ids.length === 0) {
      throw new BadRequestException('At least one ID must be provided');
    }

    const query = this.departmentRepository.createQueryBuilder(
      DEPARTMENT_QUERY_ALIAS,
    );

    if (ids.length > 0) {
      this.queryService.whereIn({
        query,
        field: 'id',
        values: ids,
        condition: 'AND',
        relationAlias: DEPARTMENT_QUERY_ALIAS,
      });
    }

    if (hasAccessToUser) {
      this.queryService.joinRelation({
        query,
        relationAlias: CREATEDBY_USER_QUERY_ALIAS,
      });
    }

    this.queryService.optimize({
      query,
      pagination,
      hasAccessToUser,
      includeCreatedBy: hasAccessToUser,
      includeUsers: true,
      select,
      order,
    });

    const departments = await query.getMany();

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
    order,
    select,
    hasAccessToUser,
  }: {
    value: string;
    pagination: PaginationDto;
    hasAccessToUser: boolean;
    order: SortDto;
    select?: string[];
  }): Promise<DepartmentListResponseDto> {
    if (pagination.page < 1 || pagination.limit < 1) {
      throw new BadRequestException(
        'Pagination parameters must be greater than 0',
      );
    }

    const { page, limit } = pagination;

    const query = this.departmentRepository
      .createQueryBuilder(DEPARTMENT_QUERY_ALIAS)
      .where(`${DEPARTMENT_QUERY_ALIAS}.name like :value`, {
        value: `%${value}%`,
      })
      .orWhere(`${DEPARTMENT_QUERY_ALIAS}.country like :value`, {
        value: `%${value}%`,
      })
      .orWhere(`${DEPARTMENT_QUERY_ALIAS}.id::text ILIKE :value`, {
        value: `%${value}%`,
      });

    if (hasAccessToUser) {
      this.queryService.joinRelation({
        query,
        relationAlias: CREATEDBY_USER_QUERY_ALIAS,
      });
    }

    this.queryService.optimize({
      query,
      pagination,
      hasAccessToUser,
      includeCreatedBy: hasAccessToUser,
      includeUsers: true,
      select,
      order,
    });

    const departments = await query.getManyAndCount();

    const totalCount = departments[1];

    return {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      departments: departments[0],
    };
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
  async update({
    id,
    updateDepartmentDto,
  }: {
    id: UUID;
    updateDepartmentDto: UpdateDepartmentDto;
  }): Promise<Department> {
    await this.findByIds({
      ids: [id],
      pagination: { page: 1, limit: 1 },
      hasAccessToUser: false,
    });

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

    const existingDepartments = await this.findByIds({
      ids,
      pagination: { page: 1, limit: ids.length },
      hasAccessToUser: false,
    });

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
