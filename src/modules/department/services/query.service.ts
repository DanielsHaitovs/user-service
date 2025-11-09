import { OptimizeCriteria } from '@/base/interface/query.request';
import { EntityQueryService } from '@/base/service/query.service';
import { DepartmentListResponseDto } from '@/department/dto/department.dto';
import { DepartmentQueryDto } from '@/department/dto/query.dto';
import { Departments } from '@/department/entities/department.entity';
import { DEPARTMENT_QUERY_ALIAS } from '@/lib/const/department.const';
import {
  CREATEDBY_USER_QUERY_ALIAS,
  USER_QUERY_ALIAS,
} from '@/lib/const/user.const';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryService extends EntityQueryService {
  async getDepartements(
    filters: DepartmentQueryDto,
    hasAccessToUser: boolean,
  ): Promise<DepartmentListResponseDto> {
    const {
      query: { ids, names, countries, userIds, createdByUserIds },
      dateFrom,
      dateTo,
      dateFilterParam,
      sort,
      pagination,
      selectUserFields,
      selectDepartmentFields,
      selectUserCreatedByFields,
    } = filters;

    let { includeUsers, includeCreatedBy } = filters;
    includeUsers ??= hasAccessToUser;
    includeCreatedBy ??= hasAccessToUser;

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

    // Join user relation if specified or if IDs are provided
    this.joinEntityRelation({
      query,
      relationAlias: USER_QUERY_ALIAS,
      shouldJoin: includeUsers && hasAccessToUser,
      condition: 'AND',
      options: {
        filters: {
          id: userIds,
        },
      },
    });

    // Join created by user relation if specified or if IDs are provided
    this.joinEntityRelation({
      query,
      relationAlias: CREATEDBY_USER_QUERY_ALIAS,
      shouldJoin: includeCreatedBy && hasAccessToUser,
      condition: 'AND',
      options: {
        filters: {
          id: createdByUserIds,
        },
      },
    });

    this.optimize({
      query,
      pagination,
      sort,
      select: [
        ...(selectUserFields ?? []),
        ...(selectDepartmentFields ?? []),
        ...(selectUserCreatedByFields ?? []),
      ],
      criteria: this.departmentQueryCriteria({
        hasAccessToUser,
        includeCreatedBy,
        includeUsers,
      }),
    });

    return await this.paginatedResult({
      query,
      alias: 'departments',
      pagination,
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
    hasAccessToUser,
    includeUsers,
    includeCreatedBy,
  }: {
    hasAccessToUser: boolean;
    includeUsers: boolean;
    includeCreatedBy: boolean;
  }): Record<string, OptimizeCriteria> {
    return {
      [DEPARTMENT_QUERY_ALIAS]: {
        permissionAccess: true,
        includeRelation: true,
      },
      [USER_QUERY_ALIAS]: {
        permissionAccess: hasAccessToUser,
        includeRelation: includeUsers,
      },
      [CREATEDBY_USER_QUERY_ALIAS]: {
        permissionAccess: hasAccessToUser,
        includeRelation: includeCreatedBy,
      },
    };
  }
}
