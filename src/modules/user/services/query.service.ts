import { QueryService } from '@/base/service/query.service';
import { getDepartmentSelectableFields } from '@/department/helper/department-fields.util';
import { DEPARTMENT_QUERY_ALIAS } from '@/lib/const/department.const';
import {
  PERMISSION_QUERY_ALIAS,
  ROLE_QUERY_ALIAS,
} from '@/lib/const/role.const';
import {
  USER_QUERY_ALIAS,
  USER_ROLE_QUERY_ALIAS,
} from '@/lib/const/user.const';
import { getRoleSelectableFields } from '@/role/helper/role-fields.util';
import { UserQueryDto } from '@/user/dto/query.dto';
import { UserListResponseDto } from '@/user/dto/user.dto';
import { User } from '@/user/entities/user.entity';
import { getUserSelectableFields } from '@/user/helper/user-fields.util';
import { Injectable } from '@nestjs/common';

import { SelectQueryBuilder } from 'typeorm';

/**
 * Service responsible for handling complex user queries with filtering, sorting, and pagination.
 * Extends the base QueryService to provide user-specific query operations while maintaining
 * consistent query patterns across the application.
 */
@Injectable()
export class UserQueryService extends QueryService {
  private readonly departmentQueryAlias = `${DEPARTMENT_QUERY_ALIAS}s`;
  private readonly userRolesQueryAlias = `${USER_ROLE_QUERY_ALIAS}s`;
  /**
   * Retrieves users based on dynamic filtering criteria with pagination and sorting support.
   *
   * Supports multiple filter combinations including array-based filtering for bulk operations
   * and boolean flags for account status filtering. The method builds queries incrementally
   * to avoid unnecessary database operations when filters are not provided.
   *
   * @param filters - Complete query configuration including filters, sorting, pagination, and field selection
   * @returns Promise resolving to paginated user list with metadata (total count, page info)
   *
   * @example
   * ```typescript
   * const result = await userQueryService.getUsers({
   *   query: { emails: ['user@example.com'], isActive: true },
   *   pagination: { page: 1, limit: 10 },
   *   sort: { sortField: 'createdAt', sortOrder: 'DESC' }
   * });
   * ```
   */
  async getUsers(filters: UserQueryDto): Promise<UserListResponseDto> {
    const {
      query: {
        ids,
        firstNames,
        lastNames,
        emails,
        isActive,
        isEmailVerified,
        departmentIds,
        departmentCountries,
        roleIds,
      },
      includeDepartment,
      includeRoles,
      sort,
      pagination: { page, limit },
      selectUserFields,
      selectDepartmentFields,
      selectRoleFields,
    } = filters;

    const queryBuilder = this.initQuery(User, USER_QUERY_ALIAS);

    // Apply ID-based filtering for bulk user operations
    if (ids && ids.length > 0) {
      this.whereIn(queryBuilder, 'id', ids);
    }

    // Filter by first names - useful for user search functionality
    if (firstNames && firstNames.length > 0) {
      this.whereIn(queryBuilder, 'firstName', firstNames);
    }

    // Filter by last names - supports partial name-based searches
    if (lastNames && lastNames.length > 0) {
      this.whereIn(queryBuilder, 'lastName', lastNames);
    }

    // Email-based filtering for user lookup and verification processes
    if (emails && emails.length > 0) {
      this.whereIn(queryBuilder, 'email', emails);
    }

    // Account status filtering - excludes deactivated users when false
    if (isActive != undefined) {
      queryBuilder.andWhere(`${queryBuilder.alias}.isActive = :isActive`, {
        isActive,
      });
    }

    // Email verification status - critical for security and user onboarding flows
    if (isEmailVerified != undefined) {
      queryBuilder.andWhere(
        `${queryBuilder.alias}.isEmailVerified = :isEmailVerified`,
        {
          isEmailVerified,
        },
      );
    }

    // Join department relation if specified or if IDs are provided
    this.joinEntityRelation(queryBuilder, this.departmentQueryAlias, {
      include: includeDepartment,
      filters: {
        id: departmentIds,
        country: departmentCountries,
      },
      selectFields: selectDepartmentFields,
    });

    // Filter by department IDs if provided
    if (departmentIds && departmentIds.length > 0) {
      this.whereIn(
        queryBuilder,
        'id',
        departmentIds,
        this.departmentQueryAlias,
      );
    }

    if (departmentCountries && departmentCountries.length > 0) {
      this.whereIn(
        queryBuilder,
        'country',
        departmentCountries,
        this.departmentQueryAlias,
      );
    }

    this.joinUserRolesRelation(
      queryBuilder,
      includeRoles,
      roleIds,
      selectRoleFields,
    );

    this.optimizeQuery(
      queryBuilder,
      { page, limit },
      sort,
      this.setQuerySelect({
        sortField: sort?.sortField,
        selectUserFields,
        includeDepartment,
        departmentIds,
        departmentCountries,
        selectDepartmentFields,
        roleIds,
        includeRoles,
        selectRoleFields,
      }),
    );

    const users = await queryBuilder.getManyAndCount();
    const totalCount = users[1];

    return {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      users: users[0],
    };
  }

  private joinUserRolesRelation(
    queryBuilder: SelectQueryBuilder<User>,
    includeRoles?: boolean,
    roleIds?: string[],
    selectRoleFields?: string[],
  ): void {
    if (
      (includeRoles !== undefined && includeRoles) ||
      (roleIds && roleIds.length > 0) ||
      (selectRoleFields && selectRoleFields.length > 0)
    ) {
      queryBuilder.leftJoinAndSelect(
        `${USER_QUERY_ALIAS}.${this.userRolesQueryAlias}`,
        USER_ROLE_QUERY_ALIAS,
      );
      queryBuilder.leftJoinAndSelect(
        `${USER_ROLE_QUERY_ALIAS}.${ROLE_QUERY_ALIAS}`,
        ROLE_QUERY_ALIAS,
      );

      if (roleIds && roleIds.length > 0) {
        queryBuilder.leftJoinAndSelect(
          `${USER_ROLE_QUERY_ALIAS}.${ROLE_QUERY_ALIAS}`,
          `${ROLE_QUERY_ALIAS}s`,
        );
        queryBuilder.andWhere(`${ROLE_QUERY_ALIAS}s.id IN (:...roleIds)`, {
          roleIds,
        });
      }
    }
  }

  private setQuerySelect({
    sortField,
    selectUserFields,
    selectDepartmentFields,
    includeDepartment,
    departmentCountries,
    departmentIds,
    roleIds,
    selectRoleFields,
    includeRoles,
  }: {
    sortField?: string | undefined;
    selectUserFields?: string[] | undefined;
    selectDepartmentFields?: string[] | undefined;
    includeDepartment?: boolean | undefined;
    departmentCountries?: string[] | undefined;
    departmentIds?: string[] | undefined;
    roleIds?: string[] | undefined;
    selectRoleFields?: string[] | undefined;
    includeRoles?: boolean | undefined;
  }): string[] {
    const select = new Array<string>();

    // Set department fields based on inclusion or filtering criteria
    this.setDepartmentQuerySelect({
      select,
      includeDepartment,
      departmentIds,
      departmentCountries,
      selectDepartmentFields,
    });

    // Set role fields based on inclusion or filtering criteria
    this.setRoleQuerySelect({
      select,
      includeRoles,
      roleIds,
      selectRoleFields,
    });

    this.setUserQuerySelect({ select, sortField, selectUserFields });

    if (
      select.length > 0 &&
      !select.includes(`${USER_QUERY_ALIAS}.id`) &&
      ((selectDepartmentFields != undefined &&
        selectDepartmentFields.length > 0) ||
        (departmentCountries != undefined && departmentCountries.length > 0) ||
        (departmentIds != undefined && departmentIds.length > 0) ||
        (selectRoleFields != undefined && selectRoleFields.length > 0) ||
        (roleIds != undefined && roleIds.length > 0) ||
        (includeRoles != undefined && includeRoles) ||
        (includeDepartment != undefined && includeDepartment))
    ) {
      select.push(`${USER_QUERY_ALIAS}.id`);
    }

    return select;
  }

  private setDepartmentQuerySelect({
    select,
    includeDepartment,
    departmentIds,
    departmentCountries,
    selectDepartmentFields,
  }: {
    select: string[];
    includeDepartment?: boolean | undefined;
    departmentIds?: string[] | undefined;
    departmentCountries?: string[] | undefined;
    selectDepartmentFields?: string[] | undefined;
  }): void {
    if (selectDepartmentFields && selectDepartmentFields.length > 0) {
      select.push(
        ...selectDepartmentFields.flatMap(
          (field) => `${this.departmentQueryAlias}.${field}`,
        ),
      );
    } else if (
      (includeDepartment != undefined && includeDepartment) ||
      (departmentCountries != undefined && departmentCountries.length > 0) ||
      (departmentIds != undefined && departmentIds.length > 0)
    ) {
      select.push(
        ...getDepartmentSelectableFields().flatMap(
          (field) => `${this.departmentQueryAlias}.${field}`,
        ),
      );
    }
  }

  private setRoleQuerySelect({
    select,
    includeRoles,
    roleIds,
    selectRoleFields,
  }: {
    select: string[];
    includeRoles?: boolean | undefined;
    roleIds?: string[] | undefined;
    selectRoleFields?: string[] | undefined;
  }): void {
    if (selectRoleFields && selectRoleFields.length > 0) {
      select.push(
        `${USER_ROLE_QUERY_ALIAS}.id`,
        `${USER_ROLE_QUERY_ALIAS}.role`,
      );

      select.push(
        ...selectRoleFields.flatMap((field) => `${ROLE_QUERY_ALIAS}.${field}`),
      );
    } else if (
      (includeRoles != undefined && includeRoles) ||
      (roleIds && roleIds.length > 0)
    ) {
      select.push(
        `${USER_ROLE_QUERY_ALIAS}.id`,
        `${USER_ROLE_QUERY_ALIAS}.role`,
      );
      const roleEntityFields = getRoleSelectableFields().filter(
        (field) =>
          field !== USER_ROLE_QUERY_ALIAS && field !== PERMISSION_QUERY_ALIAS,
      );
      select.push(
        ...roleEntityFields.flatMap((field) => `${ROLE_QUERY_ALIAS}.${field}`),
      );
    }
  }

  private setUserQuerySelect({
    select,
    sortField,
    selectUserFields,
  }: {
    select: string[];
    sortField?: string | undefined;
    selectUserFields?: string[] | undefined;
  }): void {
    if (
      (select.length > 0 || select.length === 0) &&
      selectUserFields !== undefined &&
      selectUserFields.length > 0
    ) {
      if (sortField != undefined && !selectUserFields.includes(sortField)) {
        selectUserFields.push(sortField);
      }

      select.push(
        ...selectUserFields.flatMap((field) => `${USER_QUERY_ALIAS}.${field}`),
      );
    } else if (
      select.length > 0 &&
      (selectUserFields == undefined || selectUserFields.length === 0)
    ) {
      select.push(
        ...getUserSelectableFields().flatMap(
          (field) => `${USER_QUERY_ALIAS}.${field}`,
        ),
      );
    }
  }
}
