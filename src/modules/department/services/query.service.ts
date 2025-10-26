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
  private readonly userAlias = `${USER_QUERY_ALIAS}s`;

  async getDepartements(
    filters: DepartmentQueryDto,
    hasAccessToUser: boolean,
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
    includeUsers ??= hasAccessToUser;
    includeCreatedBy ??= hasAccessToUser;

    const query = this.initQuery({
      entity: Department,
      alias: DEPARTMENT_QUERY_ALIAS,
    });

    this.whereIn({
      query,
      field: 'id',
      values: ids,
      condition: 'AND',
    });

    this.whereIn<Department>({
      query,
      field: 'name',
      values: names,
      condition: 'AND',
    });

    this.whereIn<Department>({
      query,
      field: 'country',
      values: countries,
      condition: 'AND',
    });

    // Join user relation if specified or if IDs are provided
    this.joinEntityRelation({
      query,
      relationAlias: this.userAlias,
      shouldJoin: includeUsers && hasAccessToUser,
      condition: 'OR',
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
      condition: 'OR',
      options: {
        filters: {
          id: createdByUserIds,
        },
      },
    });

    this.optimize({
      query,
      pagination: { page, limit },
      hasAccessToUser,
      includeCreatedBy,
      includeUsers,
      select: [
        ...(selectUserFields ?? []),
        ...(selectDepartmentFields ?? []),
        ...(selectUserCreatedByFields ?? []),
      ],
      order: sort,
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

  optimize({
    query,
    pagination,
    hasAccessToUser,
    includeCreatedBy,
    includeUsers,
    select,
    order,
  }: {
    query: SelectQueryBuilder<Department>;
    pagination: PaginationDto;
    hasAccessToUser: boolean;
    includeCreatedBy: boolean;
    includeUsers: boolean;
    select: string[] | undefined;
    order: SortDto | undefined;
  }): void {
    if (
      select != undefined &&
      select.length > 0 &&
      order?.sortField !== undefined &&
      !select.includes(order.sortField)
    ) {
      select.push(order.sortField);
    }

    this.validateRelationSelect<Department>({
      query,
      select,
      hasAccess: hasAccessToUser && includeCreatedBy,
      relationAlias: CREATEDBY_USER_QUERY_ALIAS,
    });

    this.validateRelationSelect<Department>({
      query,
      select,
      hasAccess: hasAccessToUser && includeUsers,
      relationAlias: this.userAlias,
    });

    this.validateSelect<Department>({ query, select });

    this.validateOrder<Department>({
      query,
      relations: {
        [this.userAlias]: hasAccessToUser && includeUsers,
        [CREATEDBY_USER_QUERY_ALIAS]: hasAccessToUser && includeCreatedBy,
      },
      order,
    });

    if (select != undefined && select.length > 0) {
      query.select(select);
    }

    this.sort<Department>({ query, order });

    this.paginate<Department>({ query, pagination });
  }
}
