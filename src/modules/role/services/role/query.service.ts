import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { QueryService } from '@/base/service/query.service';
import {
  PERMISSION_QUERY_ALIAS,
  ROLE_QUERY_ALIAS,
} from '@/lib/const/role.const';
import { CREATEDBY_USER_QUERY_ALIAS } from '@/lib/const/user.const';
import { RolesQueryDto } from '@/role/dto/query.dto';
import { RoleListResponseDto } from '@/role/dto/role.dto';
import { Role } from '@/role/entities/role.entity';
import { Injectable } from '@nestjs/common';

import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class RoleQueryService extends QueryService {
  // private readonly userAlias = `${USER_QUERY_ALIAS}s`;

  async getRoles(
    filters: RolesQueryDto,
    hasAccessToPermissions: boolean,
    hasAccessToUsers: boolean,
  ): Promise<RoleListResponseDto> {
    const {
      rolesQuery: { ids, names, createdByIds },
      permissionsQuery: {
        ids: permissionIds,
        names: permissionNames,
        codes: permissionCodes,
      },
      sort: { sortField, sortOrder },
      pagination: { page, limit },
      selectRoles,
      selectPermissions,
      selectCreatedBy,
    } = filters;

    let { includePermissions, includeCreatedBy } = filters;
    includePermissions ??= hasAccessToPermissions;
    includeCreatedBy ??= hasAccessToUsers;

    const query = this.initQuery({ entity: Role, alias: ROLE_QUERY_ALIAS });

    // Initialize the query builder with the base role entity
    if (ids && ids.length > 0) {
      this.whereIn({ query, field: 'id', values: ids, condition: 'AND' });
    }

    // Filter by last names - supports partial name-based searches
    if (names && names.length > 0) {
      this.whereIn({ query, field: 'name', values: names, condition: 'AND' });
    }

    // Join permission relation if specified or if IDs are provided
    this.joinEntityRelation({
      query,
      relationAlias: PERMISSION_QUERY_ALIAS,
      shouldJoin: includePermissions && hasAccessToPermissions,
      condition: 'AND',
      options: {
        filters: {
          id: permissionIds,
          code: permissionCodes,
          name: permissionNames,
        },
      },
    });

    // Join createdBy relation if specified or if IDs are provided
    this.joinEntityRelation({
      query,
      relationAlias: CREATEDBY_USER_QUERY_ALIAS,
      shouldJoin: includeCreatedBy && hasAccessToUsers,
      condition: 'AND',
      options: {
        filters: {
          id: createdByIds,
        },
      },
    });

    // Apply sorting, pagination, and field selection optimizations
    this.optimize({
      query,
      pagination: { page, limit },
      hasAccessToUser: hasAccessToUsers,
      hasAccessToPermissions,
      includeCreatedBy,
      includePermissions,
      select: [
        ...(selectRoles ?? []),
        ...(selectPermissions ?? []),
        ...(selectCreatedBy ?? []),
      ],
      order: { sortField, sortOrder },
    });

    const roles = await query.getManyAndCount();

    return {
      total: roles[1],
      page,
      limit,
      totalPages: Math.ceil(roles[1] / limit),
      roles: roles[0],
    };
  }

  optimize({
    query,
    pagination,
    hasAccessToUser,
    hasAccessToPermissions,
    includeCreatedBy,
    includePermissions,
    select,
    order,
  }: {
    query: SelectQueryBuilder<Role>;
    pagination: PaginationDto;
    hasAccessToUser: boolean;
    hasAccessToPermissions: boolean;
    includeCreatedBy: boolean;
    includePermissions: boolean;
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

    this.validateRelationSelect<Role>({
      query,
      select,
      hasAccess: hasAccessToUser && includeCreatedBy,
      relationAlias: CREATEDBY_USER_QUERY_ALIAS,
    });

    this.validateRelationSelect<Role>({
      query,
      select,
      hasAccess: hasAccessToPermissions && includePermissions,
      relationAlias: PERMISSION_QUERY_ALIAS,
    });

    this.validateSelect<Role>({ query, select });

    this.validateOrder<Role>({
      query,
      relations: {
        [PERMISSION_QUERY_ALIAS]: hasAccessToPermissions && includePermissions,
        [CREATEDBY_USER_QUERY_ALIAS]: hasAccessToUser && includeCreatedBy,
      },
      order,
    });

    if (select != undefined && select.length > 0) {
      query.select(select);
    }

    this.sort<Role>({ query, order });

    this.paginate<Role>({ query, pagination });
  }
}
