import { OptimizeCriteria } from '@/baseInterface/query.request';
import { EntityQueryService } from '@/baseServices/query.service';
import { PERMISSION_QUERY_ALIAS } from '@/roleConst/permission.const';
import { ROLE_QUERY_ALIAS } from '@/roleConst/role.const';
import { FilterRolesQueryDto } from '@/roleDto/query.dto';
import { RoleListResponseDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { CREATEDBY_USER_QUERY_ALIAS } from '@/userConst/user.const';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class QueryService extends EntityQueryService {
  async getRoles({
    filters,
    hasAccessToPermissions,
    hasAccessToCreatedBy,
    requestedByUserId,
  }: {
    filters: FilterRolesQueryDto;
    hasAccessToPermissions: boolean;
    hasAccessToCreatedBy: boolean;
    requestedByUserId: UUID;
  }): Promise<RoleListResponseDto> {
    const {
      ids,
      names,
      createdByIds,
      // permissionIds,
      // permissionNames,
      // permissionCodes,
      sortField,
      sortOrder,
      page,
      limit,
      dateFilterParam,
      dateFrom,
      dateTo,
      // selectRoleFields,
      // selectPermissionFields,
      // selectCreatedByFields,
      includePermissions,
      includeCreatedBy,
    } = filters;

    const query = this.initQuery({ entity: Roles, alias: ROLE_QUERY_ALIAS });

    // Initialize the query builder with the base role entity
    this.whereIn({ query, field: 'id', values: ids, condition: 'AND' });

    // Filter by last names - supports partial name-based searches
    this.whereIn({ query, field: 'name', values: names, condition: 'AND' });

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

    // Join permission relation if specified or if IDs are provided
    // this.joinEntityRelation({
    //   query,
    //   relationAlias: PERMISSION_QUERY_ALIAS,
    //   shouldJoin: includePermissions && hasAccessToPermissions,
    //   condition: 'AND',
    //   options: {
    //     filters: {
    //       id: permissionIds,
    //       code: permissionCodes,
    //       name: permissionNames,
    //     },
    //   },
    // });

    // Join createdBy relation if specified or if IDs are provided
    this.joinEntityRelation({
      query,
      relationAlias: CREATEDBY_USER_QUERY_ALIAS,
      shouldJoin: includeCreatedBy && hasAccessToCreatedBy,
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
      pagination: {
        page,
        limit,
      },
      criteria: this.roleQueryCriteria({
        includeCreatedBy,
        includePermissions,
        hasAccessToCreatedBy,
        hasAccessToPermissions,
      }),
      select: [
        // ...selectRoleFields,
        // ...selectPermissionFields,
        // ...selectCreatedByFields,
      ],
      sort: {
        sortField,
        sortOrder,
      },
    });

    return await this.paginatedResult({
      query,
      alias: 'roles',
      requestedByUserId,
    });
  }

  /**
   * Constructs query criteria for roles.
   * @param hasAccessToCreatedBy - Whether the user has access to the createdBy relation
   * @param includeCreatedBy - Whether to include the createdBy relation
   * @param hasAccessToPermissions - Whether the user has access to the permissions relation
   * @param includePermissions - Whether to include the permissions relation
   * @returns Map of relation aliases to their corresponding OptimizeCriteria
   */
  roleQueryCriteria({
    hasAccessToCreatedBy,
    hasAccessToPermissions,
    includePermissions,
    includeCreatedBy,
  }: {
    hasAccessToCreatedBy: boolean;
    hasAccessToPermissions: boolean;
    includePermissions: boolean;
    includeCreatedBy: boolean;
  }): Record<string, OptimizeCriteria> {
    return {
      [ROLE_QUERY_ALIAS]: {
        permissionAccess: true,
        includeRelation: true,
      },
      [PERMISSION_QUERY_ALIAS]: {
        permissionAccess: hasAccessToPermissions,
        includeRelation: includePermissions,
      },
      [CREATEDBY_USER_QUERY_ALIAS]: {
        permissionAccess: hasAccessToCreatedBy,
        includeRelation: includeCreatedBy,
      },
    };
  }
}
