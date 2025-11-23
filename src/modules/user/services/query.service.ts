import { OptimizeCriteria } from '@/base/interface/query.request';
import { EntityQueryService } from '@/base/service/query.service';
import { DEPARTMENT_QUERY_ALIAS } from '@/lib/const/department.const';
import {
  PERMISSION_QUERY_ALIAS,
  ROLE_QUERY_ALIAS,
} from '@/lib/const/role.const';
import {
  ASSIGNED_BY_USER_QUERY_ALIAS,
  CREATEDBY_USER_QUERY_ALIAS,
  USER_QUERY_ALIAS,
  USER_ROLE_QUERY_ALIAS,
} from '@/lib/const/user.const';
import { FilterUsersQueryDto } from '@/user/dto/query.dto';
import { UserListResponseDto } from '@/user/dto/user.dto';
import { User } from '@/user/entities/user.entity';
import { hashObject } from '@/utils/token-generator.util';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';
import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class QueryService extends EntityQueryService {
  async getUsers({
    filters,
    hasAccessToDepartments,
    hasAccessToRoles,
    hasAccessToPermissions,
    requestedByUser,
  }: {
    filters: FilterUsersQueryDto;
    hasAccessToDepartments: boolean;
    hasAccessToRoles: boolean;
    hasAccessToPermissions: boolean;
    requestedByUser: UUID;
  }): Promise<UserListResponseDto> {
    const {
      sortField,
      sortOrder,
      page,
      limit,
      includeCreatedBy,
      includeDepartments,
      includeRoles,
      includePermissions,
      selectUserFields,
      selectCreatedByFields,
      selectDepartmentFields,
      selectUserRoleFields,
      selectAssignedByFields,
      selectRoleFields,
      selectPermissionFields,
    } = filters;

    const query = this.initQuery({
      entity: User,
      alias: USER_QUERY_ALIAS,
    });

    this.genericUserFilters({
      query,
      filters,
      hasAccessToDepartments,
      hasAccessToRoles,
      hasAccessToPermissions,
    });

    this.optimize<User>({
      query,
      pagination: { limit, page },
      sort: {
        sortField: sortField ?? `${USER_QUERY_ALIAS}.createdAt`,
        sortOrder,
      },
      select: [
        ...selectUserFields,
        ...selectCreatedByFields,
        ...selectDepartmentFields,
        ...selectUserRoleFields,
        ...selectAssignedByFields,
        ...selectRoleFields,
        ...selectPermissionFields,
      ],
      criteria: this.userQueryCriteria({
        hasAccessToCreatedBy: true,
        includeCreatedBy,
        hasAccessToDepartments,
        includeDepartments,
        hasAccessToRoles,
        includeRoles,
        hasAccessToPermissions,
        includePermissions,
      }),
    });

    const cacheKey = hashObject({
      filters,
      requestedByUser,
      hasAccessToDepartments,
      hasAccessToRoles,
      hasAccessToPermissions,
    });

    query.cache(cacheKey, 300000);

    return await this.paginatedResult({
      query,
      alias: 'users',
    });
  }

  userQueryCriteria({
    hasAccessToCreatedBy,
    includeCreatedBy,
    hasAccessToDepartments,
    includeDepartments,
    hasAccessToRoles,
    includeRoles,
    hasAccessToPermissions,
    includePermissions,
  }: {
    hasAccessToCreatedBy: boolean;
    includeCreatedBy: boolean;
    hasAccessToDepartments: boolean;
    includeDepartments: boolean;
    hasAccessToRoles: boolean;
    includeRoles: boolean;
    hasAccessToPermissions: boolean;
    includePermissions: boolean;
  }): Record<string, OptimizeCriteria> {
    return {
      [USER_QUERY_ALIAS]: {
        permissionAccess: true,
        includeRelation: true,
      },
      [CREATEDBY_USER_QUERY_ALIAS]: {
        permissionAccess: hasAccessToCreatedBy,
        includeRelation: includeCreatedBy,
      },
      [DEPARTMENT_QUERY_ALIAS]: {
        permissionAccess: hasAccessToDepartments,
        includeRelation: includeDepartments,
      },
      [USER_ROLE_QUERY_ALIAS]: {
        permissionAccess: hasAccessToRoles,
        includeRelation: includeRoles,
      },
      [ASSIGNED_BY_USER_QUERY_ALIAS]: {
        permissionAccess: hasAccessToRoles,
        includeRelation: includeRoles,
        nestedFrom: USER_ROLE_QUERY_ALIAS,
      },
      [ROLE_QUERY_ALIAS]: {
        permissionAccess: hasAccessToRoles,
        includeRelation: includeRoles,
        nestedFrom: USER_ROLE_QUERY_ALIAS,
      },
      [PERMISSION_QUERY_ALIAS]: {
        permissionAccess: hasAccessToPermissions,
        includeRelation: includePermissions,
        nestedFrom: ROLE_QUERY_ALIAS,
      },
    };
  }

  private genericUserFilters({
    query,
    filters,
    hasAccessToDepartments,
    hasAccessToRoles,
    hasAccessToPermissions,
  }: {
    query: SelectQueryBuilder<User>;
    filters: FilterUsersQueryDto;
    hasAccessToDepartments: boolean;
    hasAccessToRoles: boolean;
    hasAccessToPermissions: boolean;
  }): void {
    const {
      ids,
      firstNames,
      lastNames,
      emails,
      phoneNumbers,
      isActive,
      isEmailVerified,
      createdByIds,
      departmentIds,
      departmentCountries,
      roleIds,
      roleNames,
      permissionIds,
      permissionCodes,
      includeDepartments,
      includeRoles,
      includePermissions,
      includeCreatedBy,
      dateFilterParam,
      dateFrom,
      dateTo,
    } = filters;

    this.whereIn<User>({
      query,
      field: 'id',
      values: ids,
      condition: 'AND',
    });

    this.whereIn<User>({
      query,
      field: 'firstName',
      values: firstNames,
      condition: 'AND',
    });

    this.whereIn<User>({
      query,
      field: 'lastName',
      values: lastNames,
      condition: 'AND',
    });

    if (emails != undefined) {
      query.useIndex('UQ_USER_EMAIL');
    }

    this.whereIn<User>({
      query,
      field: 'email',
      values: emails,
      condition: 'AND',
    });

    this.whereIn<User>({
      query,
      field: 'phone',
      values: phoneNumbers,
      condition: 'AND',
    });

    if (isActive !== undefined) {
      this.where({
        query,
        field: 'isActive',
        value: isActive,
        condition: 'AND',
      });
    }

    if (isEmailVerified !== undefined) {
      this.where({
        query,
        field: 'isEmailVerified',
        value: isEmailVerified,
        condition: 'AND',
      });
    }

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

    this.filterByDepartments({
      query,
      hasAccessToDepartments: includeDepartments && hasAccessToDepartments,
      departmentIds,
      departmentCountries,
    });

    this.filterByRolePermission({
      query,
      hasAccessToRoles,
      includeRoles,
      roleIds,
      roleNames,
      hasAccessToPermissions,
      includePermissions,
      permissionIds,
      permissionCodes,
    });

    if (includeCreatedBy) {
      this.joinEntityRelation({
        query,
        relationAlias: CREATEDBY_USER_QUERY_ALIAS,
        shouldJoin: true,
        condition: 'AND',
        options: {
          filters: {
            id: createdByIds,
          },
        },
      });
    }
  }

  filterByRolePermission({
    query,
    hasAccessToRoles,
    includeRoles,
    roleIds,
    roleNames,
    hasAccessToPermissions,
    includePermissions,
    permissionIds,
    permissionCodes,
  }: {
    query: SelectQueryBuilder<User>;
    hasAccessToRoles: boolean;
    includeRoles: boolean;
    roleIds?: string[] | undefined;
    roleNames?: string[] | undefined;
    hasAccessToPermissions: boolean;
    includePermissions: boolean;
    permissionIds?: string[] | undefined;
    permissionCodes?: string[] | undefined;
  }): void {
    if (!hasAccessToRoles || !includeRoles) return;

    this.joinRelation<User>({ query, alias: USER_ROLE_QUERY_ALIAS });

    this.joinRelation<User>({
      query,
      alias: ASSIGNED_BY_USER_QUERY_ALIAS,
      relationAlias: ASSIGNED_BY_USER_QUERY_ALIAS,
      nestedFrom: USER_ROLE_QUERY_ALIAS,
    });

    this.joinRelation<User>({
      query,
      alias: 'role',
      relationAlias: ROLE_QUERY_ALIAS,
      nestedFrom: USER_ROLE_QUERY_ALIAS,
    });

    this.whereIn<User>({
      query,
      field: 'id',
      values: roleIds,
      condition: 'AND',
      relationAlias: ROLE_QUERY_ALIAS,
    });

    this.whereIn<User>({
      query,
      field: 'name',
      values: roleNames,
      condition: 'AND',
      relationAlias: ROLE_QUERY_ALIAS,
    });

    if (!hasAccessToPermissions || !includePermissions) return;

    query.leftJoinAndSelect(
      `${ROLE_QUERY_ALIAS}.${PERMISSION_QUERY_ALIAS}`,
      PERMISSION_QUERY_ALIAS,
    );

    this.whereIn<User>({
      query,
      field: 'id',
      values: permissionIds,
      condition: 'AND',
      relationAlias: PERMISSION_QUERY_ALIAS,
    });

    this.whereIn<User>({
      query,
      field: 'code',
      values: permissionCodes,
      condition: 'AND',
      relationAlias: PERMISSION_QUERY_ALIAS,
    });
  }

  filterByDepartments({
    query,
    hasAccessToDepartments,
    departmentIds,
    departmentCountries,
  }: {
    query: SelectQueryBuilder<User>;
    hasAccessToDepartments: boolean;
    departmentIds?: string[] | undefined;
    departmentCountries?: string[] | undefined;
  }): void {
    if (!hasAccessToDepartments) return;

    this.joinEntityRelation({
      query,
      relationAlias: DEPARTMENT_QUERY_ALIAS,
      shouldJoin: true,
      condition: 'AND',
      options: {
        filters: {
          id: departmentIds,
        },
      },
    });

    this.joinEntityRelation({
      query,
      relationAlias: DEPARTMENT_QUERY_ALIAS,
      shouldJoin: true,
      condition: 'AND',
      options: {
        filters: {
          country: departmentCountries,
        },
      },
    });
  }

  userRoleQueryCriteria({
    hasAccessToUsers,
    includeUsers,
    hasAccessToPermissions,
    includePermissions,
  }: {
    hasAccessToUsers: boolean;
    includeUsers: boolean;
    hasAccessToPermissions: boolean;
    includePermissions: boolean;
  }): Record<string, OptimizeCriteria> {
    return {
      [USER_ROLE_QUERY_ALIAS]: {
        permissionAccess: true,
        includeRelation: true,
      },
      [ROLE_QUERY_ALIAS]: {
        permissionAccess: true,
        includeRelation: true,
        nestedFrom: USER_ROLE_QUERY_ALIAS,
      },
      [PERMISSION_QUERY_ALIAS]: {
        permissionAccess: hasAccessToPermissions,
        includeRelation: includePermissions,
        nestedFrom: ROLE_QUERY_ALIAS,
      },
      [USER_QUERY_ALIAS]: {
        permissionAccess: hasAccessToUsers,
        includeRelation: includeUsers,
      },
      [ASSIGNED_BY_USER_QUERY_ALIAS]: {
        permissionAccess: hasAccessToUsers,
        includeRelation: includeUsers,
      },
    };
  }
}
