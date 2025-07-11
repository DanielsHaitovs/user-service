import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { InjectEntityManager } from '@nestjs/typeorm';

import {
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  SelectQueryBuilder,
} from 'typeorm';

/**
 * Base service providing reusable TypeORM query building utilities.
 *
 * Centralizes common query patterns to ensure consistency across all entity services
 * and reduces code duplication. Implements a fluent interface for building complex
 * database queries with proper parameter binding to prevent SQL injection.
 *
 * @example
 * ```typescript
 * class UserQueryService extends QueryService {
 *   async findActiveUsers() {
 *     const query = this.initQuery(User, 'user');
 *     this.whereIn(query, 'status', ['active', 'pending']);
 *     return query.getMany();
 *   }
 * }
 * ```
 */
export class QueryService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * Adds an IN clause to the query for filtering by multiple values.
   *
   * Uses parameterized queries to prevent SQL injection and handles empty arrays
   * gracefully. Particularly useful for bulk operations and multi-select filters.
   *
   * @param query - The query builder to modify
   * @param field - Entity field name to filter on
   * @param values - Array of values to match against
   */
  whereIn<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    field: string,
    values: unknown[],
    relationAlias?: string,
  ): void {
    const alias = relationAlias ?? query.alias;
    const fieldPath = `${alias}.${field}`;

    query.andWhere(`${fieldPath} IN (:...${field}s)`, {
      [`${field}s`]: values,
    });
  }

  /**
   * Filters records where the specified date field is after the given date.
   *
   * Commonly used for filtering recent records, active periods, or future events.
   *
   * @param query - The query builder to modify
   * @param field - Date field name to compare
   * @param date - Minimum date threshold (exclusive)
   */
  dateGreaterThan<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    field: string,
    date: Date,
    relationAlias?: string,
  ): void {
    const alias = relationAlias ?? query.alias;
    const fieldPath = `${alias}.${field}`;

    query.andWhere(`${fieldPath}.${field} > :${field}`, {
      [field]: date,
    });
  }

  /**
   * Filters records where the specified date field is before the given date.
   *
   * Useful for historical data queries, expired records, or deadline filtering.
   *
   * @param query - The query builder to modify
   * @param field - Date field name to compare
   * @param date - Maximum date threshold (exclusive)
   */
  dateLessThan<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    field: string,
    date: Date,
    relationAlias?: string,
  ): void {
    const alias = relationAlias ?? query.alias;
    const fieldPath = `${alias}.${field}`;

    query.andWhere(`${fieldPath}.${field} < :${field}`, {
      [field]: date,
    });
  }

  /**
   * Initializes a new query builder for the specified entity.
   *
   * Provides a consistent starting point for all entity queries with proper
   * alias assignment for readable SQL generation and conflict prevention.
   *
   * @param entity - The TypeORM entity class to query
   * @param alias - Table alias for the query (used in WHERE clauses)
   * @returns Configured query builder ready for additional operations
   */
  initQuery<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    alias: string,
  ): SelectQueryBuilder<T> {
    return this.entityManager.createQueryBuilder(entity, alias);
  }

  /**
   * Applies offset-based pagination to limit result sets.
   *
   * Implements standard pagination pattern with OFFSET/LIMIT for consistent
   * API responses across all paginated endpoints.
   *
   * @param query - The query builder to paginate
   * @param page - Page number (1-based indexing)
   * @param limit - Maximum number of records per page
   */
  paginate<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    page: number,
    limit: number,
  ): void {
    query.skip((page - 1) * limit).take(limit);
  }

  /**
   * Applies sorting to query results by the specified field.
   *
   * Uses the query alias to ensure proper field resolution in complex joins.
   * Defaults to ascending order for predictable result ordering.
   *
   * @param query - The query builder to sort
   * @param sortField - Entity field name to sort by
   * @param sortOrder - Sort direction (defaults to ASC)
   */
  sort<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    sortField: string,
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): void {
    query.orderBy(`${query.alias}.${sortField}`, sortOrder);
  }

  /**
   * Applies comprehensive query optimizations including field selection, sorting, and pagination.
   *
   * Orchestrates multiple query modifications in the correct order to ensure optimal
   * database performance. Field selection reduces network overhead, while proper
   * ordering of operations prevents SQL syntax errors.
   *
   * @param query - The query builder to optimize
   * @param pagination - Page and limit configuration (optional)
   * @param order - Sorting configuration (optional)
   * @param select - Specific fields to retrieve instead of full entities (optional)
   */
  optimizeQuery<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    pagination?: PaginationDto,
    order?: SortDto,
    select?: string[],
  ): void {
    // Apply field selection first to reduce data transfer overhead
    if (select && select.length > 0) {
      query.select(select);
    }

    // Apply sorting before pagination for consistent result ordering
    if (order) {
      const { sortField, sortOrder } = order;

      if (sortField && sortField.length > 0) {
        this.sort(query, sortField, sortOrder);
      }
    }

    // Apply pagination last to limit the already-sorted dataset
    if (pagination) {
      const { page, limit } = pagination;
      if (page && limit) {
        this.paginate(query, page, limit);
      }
    }
  }

  /**
   * Joins a related entity using a left join if not already present.
   *
   * Ensures that the specified relation is included in the query without
   * duplicating joins, which can lead to performance issues or incorrect results.
   *
   * @param queryBuilder - The query builder to modify
   * @param alias - Alias for the join relation
   * @param targetAlias - Target entity alias to join
   */
  joinRelation<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    targetAlias: string,
  ): void {
    if (!this.isLeftJoinPresent(queryBuilder, queryBuilder.alias)) {
      queryBuilder.leftJoinAndSelect(
        `${queryBuilder.alias}.${targetAlias}`,
        targetAlias,
      );
    }
  }

  /**
   *
   * @param queryBuilder
   * @param targetAlias
   * @param options
   */
  joinEntityRelation<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    targetAlias: string,
    options?: {
      include?: boolean | undefined;
      filters?: Record<string, unknown[] | undefined> | undefined;
      selectFields: string[] | undefined;
    },
  ): void {
    const include = options?.include ?? false;
    const filters = options?.filters ?? {};
    const select = options?.selectFields ?? [];

    const shouldJoin =
      include ||
      Object.values(filters).some(
        (arr) => Array.isArray(arr) && arr.length > 0,
      ) ||
      select.length > 0;

    if (!this.isLeftJoinPresent(queryBuilder, targetAlias) && shouldJoin) {
      this.joinRelation(queryBuilder, targetAlias);
    }
  }

  /**
   * Checks if a leftJoin is already present in the query builder.
   *
   * Useful for preventing duplicate joins or ensuring specific joins
   * are applied only once.
   *
   * @param query - The query builder to inspect
   * @param alias - The alias of the join to check
   * @returns True if the leftJoin is present, false otherwise
   */
  isLeftJoinPresent<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    alias: string,
  ): boolean {
    return query.expressionMap.joinAttributes.some(
      (join) => join.alias.name === alias && join.alias.type === 'join',
    );
  }
}
