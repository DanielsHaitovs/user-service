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
import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryService extends EntityQueryService {
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
