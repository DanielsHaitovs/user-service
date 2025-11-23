import { DeleteResponseDto } from '@/base/dto/response.dto';
import { PostgresQueryFailedError } from '@/base/interface/query.error';
import {
  CreateDepartmentDto,
  DepartmentListResponseDto,
  UpdateDepartmentDto,
} from '@/department/dto/department.dto';
import {
  DepartmentRequestDto,
  DepartmentSearchRequestDto,
} from '@/department/dto/query.dto';
import { Departments } from '@/department/entities/department.entity';
import { HelperService } from '@/department/helper/helper.service';
import { QueryService } from '@/department/services/query.service';
import { DEPARTMENT_QUERY_ALIAS } from '@/lib/const/department.const';
import {
  CREATEDBY_USER_QUERY_ALIAS,
  USER_QUERY_ALIAS,
} from '@/lib/const/user.const';
import { User } from '@/user/entities/user.entity';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityNotFoundError, Repository } from 'typeorm';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Departments)
    private readonly departmentRepository: Repository<Departments>,
    private readonly queryService: QueryService,
    private readonly helperService: HelperService,
  ) {}

  /**
   * Creates a new department with name uniqueness validation.
   *
   * Performs upfront name conflict detection to prevent duplicate departments
   * and maintain data integrity. Uses selective field querying for optimal
   * performance during validation checks.
   *
   * @param createDepartmentDto - Departments creation data with validated fields
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
  }): Promise<Departments> {
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
            `Departments with this name ${name} already exists`,
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
    hasAccessToUser,
    control,
  }: {
    ids: UUID[];
    hasAccessToUser: boolean;
    control: DepartmentRequestDto;
  }): Promise<DepartmentListResponseDto> {
    const query = this.departmentRepository.createQueryBuilder(
      DEPARTMENT_QUERY_ALIAS,
    );

    this.queryService.whereIn({
      query,
      field: 'id',
      values: ids,
      condition: 'AND',
      relationAlias: DEPARTMENT_QUERY_ALIAS,
    });

    const {
      page,
      limit,
      sortField,
      sortOrder,
      selectCreatedByFields,
      selectDepartmentFields,
      selectUserFields,
      includeCreatedBy,
      includeUsers,
    } = control;

    if (hasAccessToUser) {
      if (includeCreatedBy) {
        this.queryService.joinRelation({
          query,
          alias: CREATEDBY_USER_QUERY_ALIAS,
        });
      }

      if (includeUsers) {
        this.queryService.joinRelation({
          query,
          alias: USER_QUERY_ALIAS,
        });
      }
    }

    this.queryService.optimize({
      query,
      pagination: {
        page,
        limit,
      },
      select: [
        ...selectCreatedByFields,
        ...selectDepartmentFields,
        ...selectUserFields,
      ],
      sort: {
        sortField,
        sortOrder,
      },
      criteria: this.queryService.departmentQueryCriteria({
        hasAccessToUser,
        includeCreatedBy,
        includeUsers,
      }),
    });

    const response = await this.queryService.paginatedResult({
      query,
      alias: 'departments',
    });

    if (response.departments.length === 0) {
      throw new EntityNotFoundError(
        'Departments',
        `Departments with IDs [${ids.join(', ')}] not found`,
      );
    }

    return response;
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
    control,
  }: {
    value: string;
    control: DepartmentSearchRequestDto;
  }): Promise<DepartmentListResponseDto> {
    const query = this.departmentRepository
      .createQueryBuilder(DEPARTMENT_QUERY_ALIAS)
      .where(
        `${DEPARTMENT_QUERY_ALIAS}.name ILIKE :${DEPARTMENT_QUERY_ALIAS}_name`,
        {
          [`${DEPARTMENT_QUERY_ALIAS}_name`]: `%${value}%`,
        },
      )
      .orWhere(
        `${DEPARTMENT_QUERY_ALIAS}.id::text ILIKE :${DEPARTMENT_QUERY_ALIAS}_id`,
        {
          [`${DEPARTMENT_QUERY_ALIAS}_id`]: `%${value}%`,
        },
      );

    const { page, limit, sortField, sortOrder, selectDepartmentFields } =
      control;

    this.queryService.optimize({
      query,
      pagination: {
        page,
        limit,
      },
      select: selectDepartmentFields,
      sort: {
        sortField,
        sortOrder,
      },
      criteria: this.queryService.departmentQueryCriteria({
        hasAccessToUser: false,
        includeCreatedBy: false,
        includeUsers: false,
      }),
    });

    return await this.queryService.paginatedResult({
      query,
      alias: 'departments',
    });
  }

  /**
   * Updates an existing department with name uniqueness validation.
   *
   * Performs upfront name conflict detection to prevent duplicate departments
   * and maintain data integrity. Uses atomic update operation with parameterized query.
   *
   * @param id - Unique identifier of the department to update
   * @param updateDepartmentDto - Departments update data with validated fields
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
  }): Promise<Departments> {
    const department = await this.helperService.getByIdOrFail(id);

    if (updateDepartmentDto.name !== undefined) {
      await this.helperService.findNameConflicts({
        id,
        name: updateDepartmentDto.name,
      });
    }

    await this.departmentRepository
      .createQueryBuilder()
      .update(Departments)
      .set(updateDepartmentDto)
      .where('id = :id', { id })
      .execute();

    if (updateDepartmentDto.name != undefined) {
      department.name = updateDepartmentDto.name;
    }

    if (updateDepartmentDto.country != undefined) {
      department.country = updateDepartmentDto.country;
    }

    return department;
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
  async deleteByIds(ids: UUID[]): Promise<DeleteResponseDto> {
    if (ids.length === 0) {
      return { deleted: 0, message: 'No departments to delete' };
    }

    await this.helperService.getManyByIdsOrFail(ids);

    const result = await this.departmentRepository
      .createQueryBuilder()
      .delete()
      .from(Departments)
      .where('id IN (:...ids)', { ids })
      .execute();

    return {
      deleted: result.affected ?? 0,
      message: 'Departments deleted successfully',
    };
  }
}
