import type { PaginationDto, SortDto } from '@/base/dto/pagination.dto';

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
  hasAccessToRoles: boolean;
  canEditRoles: boolean;
  canDeleteRoles: boolean;
  canCreateRoles: boolean;
  hasAccessToPermissions: boolean;
  canEditPermissions: boolean;
  canDeletePermissions: boolean;
  canCreatePermissions: boolean;
  hasAccessToDepartments: boolean;
  canEditDepartments: boolean;
  canDeleteDepartments: boolean;
  canCreateDepartments: boolean;
  hasAccessToUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canCreateUsers: boolean;
  hasAccessToUserRoles: boolean;
  canEditUserRoles: boolean;
  canDeleteUserRoles: boolean;
  canCreateUserRoles: boolean;
}
