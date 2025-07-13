import { QueryService } from '@/base/service/query.service';
import {
  PERMISSION_QUERY_ALIAS,
  ROLE_QUERY_ALIAS,
} from '@/lib/const/role.const';
import { RolesQueryDto } from '@/role/dto/query.dto';
import { RoleListResponseDto } from '@/role/dto/role.dto';
import { Role } from '@/role/entities/role.entity';
import {
  getPermissionsSelectableFields,
  getRoleSelectableFields,
} from '@/role/helper/role-fields.util';
import { Injectable } from '@nestjs/common';

import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * Service responsible for handling complex role&permission queries with filtering, sorting, and pagination.
 * Extends the base QueryService to provide role&permission-specific query operations while maintaining
 * consistent query patterns across the application.
 */
@Injectable()
export class RoleQueryService extends QueryService {
  /**
   * Retrieves roles&permissions based on dynamic filtering criteria with pagination and sorting support.
   *
   * Supports multiple filter combinations including array-based filtering for bulk operations
   * and boolean flags for account status filtering. The method builds queries incrementally
   * to avoid unnecessary database operations when filters are not provided.
   *
   * @param filters - Complete query configuration including filters, sorting, pagination, and field selection
   * @returns Promise resolving to paginated role&permission list with metadata (total count, page info)
   *
   * @example
   * ```typescript
   * const result = await rolesQueryService.getRoles({
   *   query: { codes: ['1111-aaaa-bbbb-cccc'], names: ['Admin'] },
   *   pagination: { page: 1, limit: 10 },
   *   sort: { sortField: 'createdAt', sortOrder: 'DESC' }
   * });
   * ```
   */
  async getRoles(filters: RolesQueryDto): Promise<RoleListResponseDto> {
    const {
      rolesQuery: { ids, names },
      permissionsQuery: {
        ids: permissionIds,
        names: permissionNames,
        codes: permissionCodes,
      },
      sort: { sortField, sortOrder },
      pagination: { page, limit },
      includePermissions,
      selectRoles,
      selectPermissions,
    } = filters;

    const queryBuilder = this.initQuery(Role, ROLE_QUERY_ALIAS);

    // Initialize the query builder with the base role entity
    if (ids && ids.length > 0) {
      this.whereIn(queryBuilder, 'id', ids);
    }

    // Filter by last names - supports partial name-based searches
    if (names && names.length > 0) {
      this.whereIn(queryBuilder, 'name', names);
    }

    // Join permissions relation if specified or if any permission filters are provided
    this.joinPermissionRelation(
      queryBuilder,
      includePermissions,
      permissionIds,
      permissionCodes,
      permissionNames,
      selectPermissions,
    );

    // Filter by last names - supports partial name-based searches
    if (permissionIds && permissionIds.length > 0) {
      this.whereIn(queryBuilder, 'id', permissionIds, PERMISSION_QUERY_ALIAS);
    }

    // Filter by last names - supports partial name-based searches
    if (permissionCodes && permissionCodes.length > 0) {
      this.whereIn(
        queryBuilder,
        'code',
        permissionCodes,
        PERMISSION_QUERY_ALIAS,
      );
    }

    // Filter by last names - supports partial name-based searches
    if (permissionNames && permissionNames.length > 0) {
      this.whereIn(
        queryBuilder,
        'name',
        permissionNames,
        PERMISSION_QUERY_ALIAS,
      );
    }

    // Apply sorting, pagination, and field selection optimizations
    this.optimizeQuery(
      queryBuilder,
      { page, limit },
      { sortField, sortOrder },
      this.setQuerySelect(
        selectRoles,
        selectPermissions,
        includePermissions,
        permissionIds,
        permissionCodes,
        permissionNames,
      ),
    );

    const roles = await queryBuilder.getManyAndCount();

    return {
      total: roles[1],
      page,
      limit,
      totalPages: Math.ceil(roles[1] / limit),
      roles: roles[0],
    };
  }

  /**
   * Joins the permission relation to the query builder if not already present.
   * This method checks if the left join for permissions is already included
   * and adds it only if necessary based on provided filters or flags.
   *
   * @param queryBuilder - The TypeORM query builder instance to modify
   * @param alias - The alias for the role entity in the query
   * @param targetAlias - The alias for the permission entity in the query
   * @param includePermissions - Flag indicating whether to include permissions
   * @param ids - Optional array of permission IDs to filter by
   * @param codes - Optional array of permission codes to filter by
   * @param names - Optional array of permission names to filter by
   */
  private joinPermissionRelation<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    includePermissions?: boolean,
    ids?: string[],
    codes?: string[],
    names?: string[],
    selectPermissions?: string[],
  ): void {
    if (this.isLeftJoinPresent(queryBuilder, PERMISSION_QUERY_ALIAS)) {
      return;
    }

    if (
      (ids && ids.length > 0) ||
      (codes && codes.length > 0) ||
      (names && names.length > 0) ||
      (includePermissions != undefined && includePermissions) ||
      (selectPermissions && selectPermissions.length > 0)
    ) {
      this.joinRelation(queryBuilder, PERMISSION_QUERY_ALIAS);
    }
  }

  private setQuerySelect(
    selectRoles?: string[],
    selectPermissions?: string[],
    includePermissions?: boolean,
    ids?: string[],
    codes?: string[],
    names?: string[],
  ): string[] {
    const select = new Array<string>();

    this.setRoleQuerySelect(
      select,
      selectRoles,
      selectPermissions,
      includePermissions,
    );
    this.setPermissionsQuerySelect(
      select,
      selectPermissions,
      includePermissions,
      ids,
      codes,
      names,
    );

    return select;
  }

  private setRoleQuerySelect(
    select: string[],
    selectRoles?: string[],
    selectPermissions?: string[],
    includePermissions?: boolean,
  ): void {
    if (selectRoles && selectRoles.length > 0) {
      select.push(
        ...selectRoles.flatMap((field) => `${ROLE_QUERY_ALIAS}.${field}`),
      );
    } else if (
      (includePermissions != undefined && includePermissions) ||
      (selectPermissions && selectPermissions.length > 0)
    ) {
      select.push(
        ...getRoleSelectableFields().flatMap(
          (field) => `${ROLE_QUERY_ALIAS}.${field}`,
        ),
      );
    }
  }

  private setPermissionsQuerySelect(
    select: string[],
    selectPermissions?: string[],
    includePermissions?: boolean,
    ids?: string[],
    codes?: string[],
    names?: string[],
  ): void {
    if (selectPermissions && selectPermissions.length > 0) {
      select.push(
        ...selectPermissions.flatMap(
          (field) => `${PERMISSION_QUERY_ALIAS}.${field}`,
        ),
      );
    } else if (
      (includePermissions != undefined && includePermissions) ||
      (ids && ids.length > 0) ||
      (codes && codes.length > 0) ||
      (names && names.length > 0)
    ) {
      select.push(
        ...getPermissionsSelectableFields().flatMap(
          (field) => `${PERMISSION_QUERY_ALIAS}.${field}`,
        ),
      );
    }

    if (
      ((selectPermissions && selectPermissions.length > 0) ||
        (includePermissions != undefined && includePermissions) ||
        (ids && ids.length > 0) ||
        (codes && codes.length > 0) ||
        (names && names.length > 0)) &&
      !select.includes(`${ROLE_QUERY_ALIAS}.id`)
    ) {
      select.push(`${ROLE_QUERY_ALIAS}.id`);
    }
  }
}
