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

import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class DepartmentQueryService extends QueryService {
  private readonly departmentAlias = DEPARTMENT_QUERY_ALIAS;
  private readonly userAlias = `${USER_QUERY_ALIAS}s`;

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
    includeUsers ??= hasUserPermissions;
    includeCreatedBy ??= hasUserPermissions;

    const queryBuilder = this.initQuery(Department, this.departmentAlias);

    if (ids && ids.length > 0) {
      this.whereIn(queryBuilder, 'id', ids, 'AND');
    }

    this.whereIn<Department>(queryBuilder, 'name', names, 'AND');

    this.whereIn<Department>(queryBuilder, 'country', countries, 'AND');

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
      CREATEDBY_USER_QUERY_ALIAS,
      includeCreatedBy && hasUserPermissions,
      'AND',
      {
        filters: {
          id: createdByUserIds,
        },
      },
    );

    this.optimize(
      queryBuilder,
      { page, limit },
      hasUserPermissions,
      includeCreatedBy,
      includeUsers,
      selectDepartmentFields,
      selectUserFields,
      selectUserCreatedByFields,
      sort,
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

  optimize(
    query: SelectQueryBuilder<Department>,
    pagination: PaginationDto,
    hasUserPermissions: boolean,
    includeCreatedBy: boolean,
    includeUsers: boolean,
    selectDepartmentFields?: string[],
    selectUserFields?: string[],
    selectUserCreatedByFields?: string[],
    order?: SortDto,
  ): void {
    const select = new Array<string>();

    this.validateSelect<Department>(
      query,
      select,
      selectUserCreatedByFields,
      hasUserPermissions && includeCreatedBy,
      CREATEDBY_USER_QUERY_ALIAS,
    );

    this.validateSelect<Department>(
      query,
      select,
      selectUserFields,
      hasUserPermissions && includeUsers,
      this.userAlias,
    );

    this.validateSelect<Department>(
      query,
      select,
      selectDepartmentFields,
      true,
    );

    this.validateOrder<Department>(
      query,
      [this.userAlias, CREATEDBY_USER_QUERY_ALIAS],
      hasUserPermissions,
      select,
      order,
    );

    if (select.length > 0 && !select.includes(`${query.alias}.id`)) {
      select.push(`${query.alias}.id`);
    }

    this.optimizeQuery({ query, pagination, order, select });
  }
}
