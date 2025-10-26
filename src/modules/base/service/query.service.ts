import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { ForbiddenException } from '@nestjs/common';
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
  whereIn<T extends ObjectLiteral>({
    query,
    field,
    values,
    condition,
    relationAlias,
  }: {
    query: SelectQueryBuilder<T>;
    field: string;
    values: unknown[] | undefined;
    condition: 'OR' | 'AND';
    relationAlias?: string;
  }): void {
    if (!values || values.length === 0) return;

    const alias = relationAlias ?? query.alias;
    const fieldPath = `${alias}.${field}`;

    if (condition === 'OR') {
      query.orWhere(`${fieldPath} IN (:...${alias}_${field}s)`, {
        [`${alias}_${field}s`]: values,
      });
    } else {
      query.andWhere(`${fieldPath} IN (:...${alias}_${field}s)`, {
        [`${alias}_${field}s`]: values,
      });
    }
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
  dateGreaterThan<T extends ObjectLiteral>({
    query,
    field,
    date,
    relationAlias,
  }: {
    query: SelectQueryBuilder<T>;
    field: string;
    date: Date;
    relationAlias?: string;
  }): void {
    const alias = relationAlias ?? query.alias;
    const fieldPath = `${alias}.${field}`;

    query.andWhere(`${fieldPath} > :${alias}_${field}`, {
      [`${alias}_${field}`]: date,
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
  dateLessThan<T extends ObjectLiteral>({
    query,
    field,
    date,
    relationAlias,
  }: {
    query: SelectQueryBuilder<T>;
    field: string;
    date: Date;
    relationAlias?: string;
  }): void {
    const alias = relationAlias ?? query.alias;
    const fieldPath = `${alias}.${field}`;

    query.andWhere(`${fieldPath} < :${alias}_${field}`, {
      [`${alias}_${field}`]: date,
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
  initQuery<T extends ObjectLiteral>({
    entity,
    alias,
  }: {
    entity: EntityTarget<T>;
    alias: string;
  }): SelectQueryBuilder<T> {
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
  paginate<T extends ObjectLiteral>({
    query,
    pagination,
  }: {
    query: SelectQueryBuilder<T>;
    pagination?: PaginationDto;
  }): void {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;

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
  sort<T extends ObjectLiteral>({
    query,
    order,
  }: {
    query: SelectQueryBuilder<T>;
    order: SortDto | undefined;
  }): void {
    if (order?.sortField == undefined) return;

    // order.sortOrder ??= 'ASC';

    const { sortField, sortOrder } = order;

    query.orderBy(sortField, sortOrder);
  }

  validateRelationSelect<T extends ObjectLiteral>({
    query,
    select,
    hasAccess,
    relationAlias,
  }: {
    query: SelectQueryBuilder<T>;
    select: string[] | undefined;
    hasAccess: boolean;
    relationAlias?: string;
  }): void {
    if (select == undefined || select.length === 0) return;

    if (relationAlias == undefined) return;

    const hasFieldFromRelation = select.some((field) =>
      field.startsWith(`${relationAlias}.`),
    );

    if (!hasAccess && hasFieldFromRelation) {
      throw new ForbiddenException(
        `Cannot select fields from ${query.alias} with relation ${relationAlias} without access`,
      );
    }

    if (hasAccess && hasFieldFromRelation) {
      if (!this.isLeftJoinPresent({ query, relationAlias })) {
        this.joinRelation<T>({ query, relationAlias });
      }

      if (!select.includes(`${relationAlias}.id`)) {
        select.push(`${relationAlias}.id`);
      }
    }
  }

  validateSelect<T extends ObjectLiteral>({
    query,
    select,
  }: {
    query: SelectQueryBuilder<T>;
    select: string[] | undefined;
  }): void {
    if (select == undefined || select.length === 0) return;

    if (!select.includes(`${query.alias}.id`)) {
      select.push(`${query.alias}.id`);
    }
  }

  validateOrder<T extends ObjectLiteral>({
    query,
    relations,
    order,
  }: {
    query: SelectQueryBuilder<T>;
    relations: Record<string, boolean>;
    order: SortDto | undefined;
  }): void {
    if (order?.sortField === undefined) return;

    Object.keys(relations).forEach((relationAlias) => {
      const hasAccess = relations[relationAlias];

      if (order.sortField.includes(relationAlias) && hasAccess === false) {
        throw new ForbiddenException(
          `Cannot order by field ${order.sortField} without access`,
        );
      } else if (
        order.sortField.includes(relationAlias) &&
        hasAccess === true
      ) {
        if (!this.isLeftJoinPresent({ query, relationAlias })) {
          this.joinRelation<T>({ query, relationAlias });
        }
      }
    });
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
  joinRelation<T extends ObjectLiteral>({
    query,
    relationAlias,
  }: {
    query: SelectQueryBuilder<T>;
    relationAlias: string;
  }): void {
    if (!this.isLeftJoinPresent({ query, relationAlias })) {
      query.leftJoinAndSelect(`${query.alias}.${relationAlias}`, relationAlias);
    }
  }

  /**
   *
   * @param queryBuilder
   * @param targetAlias
   * @param options
   */
  joinEntityRelation<T extends ObjectLiteral>({
    query,
    relationAlias,
    shouldJoin,
    condition,
    options,
  }: {
    query: SelectQueryBuilder<T>;
    relationAlias: string;
    shouldJoin: boolean;
    condition: 'OR' | 'AND';
    options?: {
      filters?: Record<string, unknown[] | undefined> | undefined;
    };
  }): void {
    const filters = options?.filters ?? {};

    if (!shouldJoin) return;

    if (!this.isLeftJoinPresent({ query, relationAlias })) {
      this.joinRelation({ query, relationAlias });
    }

    Object.entries(filters).forEach(([field, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        this.whereIn({
          query,
          field,
          values,
          condition,
          relationAlias,
        });
      }
    });
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
  isLeftJoinPresent<T extends ObjectLiteral>({
    query,
    relationAlias,
  }: {
    query: SelectQueryBuilder<T>;
    relationAlias: string;
  }): boolean {
    return query.expressionMap.joinAttributes.some(
      (join) => join.alias.name === relationAlias && join.alias.type === 'join',
    );
  }
}
