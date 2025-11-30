import { OptimizeCriteria } from '@/base/interface/query.request';
import { EntityQueryService } from '@/base/service/query.service';
import { DepartmentListResponseDto } from '@/department/dto/department.dto';
import { FilterDepartmentsQueryDto } from '@/department/dto/query.dto';
import { Departments } from '@/department/entities/department.entity';
import { DEPARTMENT_QUERY_ALIAS } from '@/lib/const/department.const';
import {
  CREATEDBY_USER_QUERY_ALIAS,
  USER_QUERY_ALIAS,
} from '@/lib/const/user.const';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class QueryService extends EntityQueryService {
  async getDepartements({
    filters,
    hasAccessToUsers,
    requestedByUserId,
  }: {
    filters: FilterDepartmentsQueryDto;
    hasAccessToUsers: boolean;
    requestedByUserId: UUID;
  }): Promise<DepartmentListResponseDto> {
    const {
      ids,
      names,
      countries,
      userIds,
      createdByUserIds,
      dateFrom,
      dateTo,
      dateFilterParam,
      sortField,
      sortOrder,
      page,
      limit,
      selectUserFields,
      selectDepartmentFields,
      selectCreatedByFields,
      includeCreatedBy,
      includeUsers,
    } = filters;

    const query = this.initQuery({
      entity: Departments,
      alias: DEPARTMENT_QUERY_ALIAS,
    });

    this.whereIn({
      query,
      field: 'id',
      values: ids,
      condition: 'AND',
    });

    this.whereIn({
      query,
      field: 'name',
      values: names,
      condition: 'AND',
    });

    this.whereIn({
      query,
      field: 'country',
      values: countries,
      condition: 'AND',
    });

    if (dateFilterParam != undefined) {
      this.dateGreaterThan({
        query,
        field: dateFilterParam,
        date: dateFrom,
        condition: 'AND',
      });

      this.dateLessThan({
        query,
        field: dateFilterParam,
        date: dateTo,
        condition: 'AND',
      });
    }

    query.groupBy(`${query.alias}.id`);

    // Join user relation if specified or if IDs are provided
    this.joinEntityRelation({
      query,
      relationAlias: USER_QUERY_ALIAS,
      shouldJoin: includeUsers && hasAccessToUsers,
      condition: 'AND',
      options: {
        filters: {
          id: userIds,
        },
      },
    });

    if (includeUsers && hasAccessToUsers) {
      query.addGroupBy(`${USER_QUERY_ALIAS}.id`);
    }

    // Join created by user relation if specified or if IDs are provided
    this.joinEntityRelation({
      query,
      relationAlias: CREATEDBY_USER_QUERY_ALIAS,
      shouldJoin: includeCreatedBy && hasAccessToUsers,
      condition: 'AND',
      options: {
        filters: {
          id: createdByUserIds,
        },
      },
    });

    if (includeCreatedBy && hasAccessToUsers) {
      query.addGroupBy(`${CREATEDBY_USER_QUERY_ALIAS}.id`);
    }

    this.optimize({
      query,
      pagination: {
        page,
        limit,
      },
      sort: {
        sortField,
        sortOrder,
      },
      select: [
        ...selectUserFields,
        ...selectDepartmentFields,
        ...selectCreatedByFields,
      ],
      criteria: this.departmentQueryCriteria({
        hasAccessToUsers,
        includeCreatedBy,
        includeUsers,
      }),
    });

    return await this.paginatedResult({
      query,
      alias: 'departments',
      requestedByUserId,
    });
  }

  /**
   * Constructs query criteria for department queries based on access and inclusion flags.
   * @param hasAccessToUser - Indicates if the requester has access to user data.
   * @param includeUsers - Indicates if user relations should be included.
   * @param includeCreatedBy - Indicates if created by user relations should be included.
   * @returns A map of relation aliases to their corresponding optimization criteria.
   */
  departmentQueryCriteria({
    hasAccessToUsers,
    includeUsers,
    includeCreatedBy,
  }: {
    hasAccessToUsers: boolean;
    includeUsers: boolean;
    includeCreatedBy: boolean;
  }): Record<string, OptimizeCriteria> {
    return {
      [DEPARTMENT_QUERY_ALIAS]: {
        permissionAccess: true,
        includeRelation: true,
      },
      [USER_QUERY_ALIAS]: {
        permissionAccess: hasAccessToUsers,
        includeRelation: includeUsers,
      },
      [CREATEDBY_USER_QUERY_ALIAS]: {
        permissionAccess: hasAccessToUsers,
        includeRelation: includeCreatedBy,
      },
    };
  }
}
