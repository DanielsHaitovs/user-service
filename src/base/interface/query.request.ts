import type { PaginationDto, SortDto } from '@/baseDto/pagination.dto';

import type { UUID } from 'crypto';
import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface OptimizeCriteria {
  permissionAccess: boolean;
  includeRelation: boolean;
  nestedFrom?: string;
}

export interface QueryRequest<T extends ObjectLiteral> {
  query: SelectQueryBuilder<T>;
  pagination: PaginationDto;
  sort: SortDto | undefined;
  select: string[] | undefined;
  criteria: Record<string, OptimizeCriteria>;
}

export interface QueryJoinOptions {
  filters: Record<
    string,
    { key: unknown[] | undefined; condition: 'AND' | 'OR' }
  >;
}

export interface UserAccessPermissions {
  id: UUID;
  // roles
  canCreateRoles: boolean;
  canReadRoles: boolean;
  canUpdateRoles: boolean;
  canDeleteRoles: boolean;
  // permissions
  canCreatePermissions: boolean;
  canReadPermissions: boolean;
  canUpdatePermissions: boolean;
  canDeletePermissions: boolean;
  // role permissions
  canAssignPermissionsToRoles: boolean;
  canUnassignPermissionsFromRoles: boolean;
  // departments
  canCreateDepartments: boolean;
  canReadDepartments: boolean;
  canUpdateDepartments: boolean;
  canDeleteDepartments: boolean;
  // store
  canCreateStore: boolean;
  canReadStore: boolean;
  canUpdateStore: boolean;
  canDeleteStore: boolean;
  // users
  canCreateUsers: boolean;
  canReadUsers: boolean;
  canUpdateUsers: boolean;
  canDeleteUsers: boolean;
  // user roles
  canReadUserRoles: boolean;
  canAssignUserToRoles: boolean;
  canUnassignUserFromRoles: boolean;
  // user store
  canReadUserStore: boolean;
  canAssignUserToStore: boolean;
  canUnassignUserFromStore: boolean;
  // user departments
  canReadUserDepartments: boolean;
  canAssignUserToDepartments: boolean;
  canUnassignUserFromDepartments: boolean;
}
