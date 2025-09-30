import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { QueryService } from '@/base/service/query.service';
import { DepartmentListResponseDto } from '@/department/dto/department.dto';
import { DepartmentQueryDto } from '@/department/dto/query.dto';
import { Department } from '@/department/entities/department.entity';
import { DEPARTMENT_QUERY_ALIAS } from '@/lib/const/department.const';
import {
  CREATEDBY_USER_QUERY_ALIAS,
  USER_QUERY_ALIAS,
} from '@/lib/const/user.const';
import { Injectable } from '@nestjs/common';

import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class DepartmentQueryService extends QueryService {
  private readonly departmentAlias = DEPARTMENT_QUERY_ALIAS;
  private readonly userAlias = USER_QUERY_ALIAS;
  private readonly createdByAlias = CREATEDBY_USER_QUERY_ALIAS;

  async getDepartements(
    filters: DepartmentQueryDto,
    hasUserPermissions: boolean,
  ): Promise<DepartmentListResponseDto> {
    const {
      query: { ids, names, countries, userIds, createdByUserIds },
      sort,
      pagination: { page, limit },
      selectUserFields,
      selectDepartmentFields,
      selectUserCreatedByFields,
    } = filters;

    let { includeUsers, includeCreatedBy } = filters;
    includeUsers ??= true;
    includeCreatedBy ??= true;

    const queryBuilder = this.initQuery(Department, this.departmentAlias);

    // Apply ID-based filtering for bulk user operations
    if (ids && ids.length > 0) {
      this.whereIn(queryBuilder, 'id', ids, 'AND');
    }

    // Filter by first names - useful for user search functionality
    if (names && names.length > 0) {
      if (
        selectDepartmentFields !== undefined &&
        !selectDepartmentFields.includes(`${DEPARTMENT_QUERY_ALIAS}.name`)
      ) {
        selectDepartmentFields.push(`${DEPARTMENT_QUERY_ALIAS}.name`);
      }

      this.whereIn(queryBuilder, 'name', names, 'AND');
    }

    // Filter by last names - supports partial name-based searches
    if (countries && countries.length > 0) {
      if (
        selectDepartmentFields !== undefined &&
        !selectDepartmentFields.includes(`${DEPARTMENT_QUERY_ALIAS}.country`)
      ) {
        selectDepartmentFields.push(`${DEPARTMENT_QUERY_ALIAS}.country`);
      }

      this.whereIn(queryBuilder, 'country', countries, 'AND');
    }

    // Join user relation if specified or if IDs are provided
    this.joinEntityRelation(
      queryBuilder,
      this.userAlias,
      includeUsers && hasUserPermissions,
      'AND',
      {
        filters: {
          id: userIds,
        },
      },
    );

    // Join created by user relation if specified or if IDs are provided
    this.joinEntityRelation(
      queryBuilder,
      this.createdByAlias,
      includeCreatedBy && hasUserPermissions,
      'AND',
      {
        filters: {
          id: createdByUserIds,
        },
      },
    );

    this.optimizeQuery<Department>(
      queryBuilder,
      { page, limit },
      sort,
      selectDepartmentFields,
      selectUserFields,
      selectUserCreatedByFields,
      hasUserPermissions,
      includeCreatedBy,
      includeUsers,
    );

    const departments = await queryBuilder.getManyAndCount();
    const totalCount = departments[1];

    return {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      departments: departments[0],
    };
  }

  override optimizeQuery<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    pagination?: PaginationDto,
    order?: SortDto,
    selectDepartmentFields?: string[],
    selectUserFields?: string[],
    selectUserCreatedByFields?: string[],
    hasUserPermissions?: boolean,
    includeCreatedBy?: boolean,
    includeUsers?: boolean,
  ): void {
    const select = new Array<string>();
    includeCreatedBy ??= true;
    includeUsers ??= true;

    if (includeCreatedBy) {
      this.validateSelect<T>(
        query,
        select,
        selectUserCreatedByFields,
        this.createdByAlias,
        hasUserPermissions ?? false,
        false,
      );
    }

    if (includeUsers) {
      this.validateSelect<T>(
        query,
        select,
        selectUserFields,
        this.userAlias,
        hasUserPermissions ?? false,
        false,
      );
    }

    this.validateSelect<T>(
      query,
      select,
      selectDepartmentFields,
      this.departmentAlias,
      true,
      true,
    );

    if (select.length > 0 && !select.includes(`${DEPARTMENT_QUERY_ALIAS}.id`)) {
      select.push(`${DEPARTMENT_QUERY_ALIAS}.id`);
    }

    if (select.length > 0) {
      if (
        this.isLeftJoinPresent(query, this.userAlias) &&
        !select.includes(`${USER_QUERY_ALIAS}.id`)
      ) {
        select.push(`${USER_QUERY_ALIAS}.id`);
      }

      if (
        this.isLeftJoinPresent(query, this.createdByAlias) &&
        !select.includes(`${this.createdByAlias}.id`)
      ) {
        select.push(`${this.createdByAlias}.id`);
      }
    }

    this.validateOrder<T>(
      query,
      [this.userAlias, this.createdByAlias],
      hasUserPermissions ?? false,
      order,
    );

    super.optimizeQuery(query, pagination, order, select);
  }
}
