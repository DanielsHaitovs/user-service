import {
  PaginatedResponseDto,
  PaginationDto,
  SortDto,
} from '@/base/dto/pagination.dto';
import { OptimizeCriteria, QueryRequest } from '@/base/interface/query.request';
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
export class EntityQueryService {
  constructor(
    @InjectEntityManager()
    protected entityManager: EntityManager,
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

  where<T extends ObjectLiteral>({
    query,
    field,
    value,
    condition,
    relationAlias,
  }: {
    query: SelectQueryBuilder<T>;
    field: string;
    value: unknown;
    condition: 'OR' | 'AND';
    relationAlias?: string;
  }): void {
    if (value == undefined) return;

    const alias = relationAlias ?? query.alias;
    const fieldPath = `${alias}.${field}`;

    if (condition === 'OR') {
      query.orWhere(`${fieldPath} = :${alias}_${field}_to`, {
        [`${alias}_${field}_to`]: value,
      });
    } else {
      query.andWhere(`${fieldPath} = :${alias}_${field}_to`, {
        [`${alias}_${field}_to`]: value,
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
    condition,
  }: {
    query: SelectQueryBuilder<T>;
    field: string;
    date: Date | undefined;
    condition: 'OR' | 'AND';
    relationAlias?: string;
  }): void {
    if (date == undefined) return;
    const alias = relationAlias ?? query.alias;
    const fieldPath = `${alias}.${field}`;

    if (condition === 'OR') {
      query.orWhere(`${fieldPath} > :${alias}_${field}_from`, {
        [`${alias}_${field}_from`]: date,
      });

      return;
    }

    query.andWhere(`${fieldPath} > :${alias}_${field}_from`, {
      [`${alias}_${field}_from`]: date,
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
    condition,
    relationAlias,
  }: {
    query: SelectQueryBuilder<T>;
    field: string;
    date: Date | undefined;
    condition: 'OR' | 'AND';
    relationAlias?: string;
  }): void {
    if (date == undefined) return;

    const alias = relationAlias ?? query.alias;
    const fieldPath = `${alias}.${field}`;

    if (condition === 'OR') {
      query.orWhere(`${fieldPath} < :${alias}_${field}`, {
        [`${alias}_${field}`]: date,
      });

      return;
    }

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
    sort,
  }: {
    query: SelectQueryBuilder<T>;
    sort: SortDto | undefined;
  }): void {
    if (sort?.sortField == undefined) return;

    const { sortField, sortOrder } = sort;

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
    relationAlias: string | undefined;
  }): void {
    if (select == undefined || select.length === 0) return;

    if (relationAlias == undefined) return;

    const hasFieldFromRelation = select.some((field) =>
      field.startsWith(`${relationAlias}.`),
    );

    if (!hasAccess && hasFieldFromRelation) {
      const filtered = select.filter(
        (field) => !field.startsWith(`${relationAlias}.`),
      );

      select.splice(0, select.length, ...filtered);
      return;
    }

    if (hasAccess && hasFieldFromRelation) {
      this.joinRelation<T>({ query, alias: relationAlias });

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
    sort,
  }: {
    query: SelectQueryBuilder<T>;
    relations: Record<string, boolean>;
    sort: SortDto | undefined;
  }): void {
    if (sort?.sortField == undefined) return;

    Object.keys(relations).forEach((relationAlias) => {
      const hasAccess = relations[relationAlias];

      if (sort.sortField != undefined) {
        if (sort.sortField.includes(relationAlias) && hasAccess === false) {
          throw new ForbiddenException(
            `Cannot order by field ${sort.sortField} without access`,
          );
        } else if (
          sort.sortField.includes(relationAlias) &&
          hasAccess === true
        ) {
          this.joinRelation<T>({ query, alias: relationAlias });
        }
      }
    });
  }

  joinRelation<T extends ObjectLiteral>({
    query,
    nestedFrom,
    alias,
    relationAlias,
  }: {
    query: SelectQueryBuilder<T>;
    nestedFrom?: string;
    alias: string;
    relationAlias?: string;
  }): void {
    if (nestedFrom != undefined) {
      if (!this.isJoinPresent({ query, relationAlias: nestedFrom })) {
        query.leftJoinAndSelect(
          `${query.alias}.${alias}`,
          relationAlias ?? alias,
        );
      }
      query.leftJoinAndSelect(`${nestedFrom}.${alias}`, relationAlias ?? alias);
    } else if (
      !this.isJoinPresent({ query, relationAlias: relationAlias ?? alias })
    ) {
      query.leftJoinAndSelect(
        `${query.alias}.${relationAlias ?? alias}`,
        relationAlias ?? alias,
      );
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
    nestedFrom,
  }: {
    query: SelectQueryBuilder<T>;
    relationAlias: string;
    shouldJoin: boolean;
    condition?: 'OR' | 'AND';
    options?: { filters: Record<string, unknown[] | undefined> };
    nestedFrom?: string;
  }): void {
    const filters = options?.filters ?? {};

    if (!shouldJoin) return;

    this.joinRelation({ query, alias: nestedFrom ?? relationAlias });

    if (options?.filters == undefined) return;

    condition ??= 'AND';

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
  isJoinPresent<T extends ObjectLiteral>({
    query,
    relationAlias,
  }: {
    query: SelectQueryBuilder<T>;
    relationAlias: string;
  }): boolean {
    return query.expressionMap.joinAttributes.some(
      (j) => j.alias.name === relationAlias,
    );
  }

  optimize<T extends ObjectLiteral>(queryCriteria: QueryRequest<T>): void {
    const { query, pagination, sort, select, criteria } = queryCriteria;

    if (
      select != undefined &&
      select.length > 0 &&
      sort?.sortField !== undefined &&
      !select.includes(sort.sortField)
    ) {
      select.push(sort.sortField);
    }

    const relations: Record<string, boolean> = {};
    const relationsNestedFrom: Record<string, string> = {};

    Object.entries(criteria).forEach(
      ([relationAlias, { permissionAccess, includeRelation, nestedFrom }]) => {
        const hasAccess = permissionAccess && includeRelation;
        if (query.alias !== relationAlias) {
          this.validateRelationSelect<T>({
            query,
            select,
            hasAccess,
            relationAlias,
          });
          relations[relationAlias] = hasAccess;

          if (nestedFrom !== undefined) {
            relationsNestedFrom[relationAlias] = nestedFrom;
          }
        }
      },
    );

    this.validateOrder<T>({
      query,
      relations,
      sort,
    });

    this.validateResponseSelectPayload<T>({
      query,
      select,
      criteria,
    });

    this.sort<T>({ query, sort });

    this.paginate<T>({ query, pagination });
  }

  async paginatedResult<T extends ObjectLiteral, K extends string>({
    query,
    alias,
  }: {
    query: SelectQueryBuilder<T>;
    alias: K;
  }): Promise<PaginatedResponseDto & Record<K, T[]>> {
    const page = query.expressionMap.skip ?? 0;
    const limit = query.expressionMap.take ?? 10;

    query.distinct(true);

    const [items, totalCount] = await query.getManyAndCount();

    return {
      total: totalCount,
      page: page / limit + 1,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      [alias]: items,
    } as PaginatedResponseDto & Record<K, T[]>;
  }

  private validateResponseSelectPayload<T extends ObjectLiteral>({
    query,
    select,
    criteria,
  }: {
    query: SelectQueryBuilder<T>;
    select: string[] | undefined;
    criteria: Record<string, OptimizeCriteria>;
  }): void {
    if (select == undefined || select.length === 0) return;
    this.validateSelect<T>({ query, select });

    for (const key of Object.keys(query.getParameters())) {
      const [alias] = key.split('_');
      if (alias == undefined) continue;
      this.ensureSelectChainIds(alias, criteria, select);
    }

    query.select(select);
  }

  private ensureSelectChainIds(
    fromKey: string,
    criteria: Record<string, OptimizeCriteria>,
    select: string[],
    mutate = true,
  ): string[] {
    const visited = new Set<string>();
    const chainLeafToRoot: string[] = [];

    let cur: string | undefined = fromKey;
    while (cur) {
      if (visited.has(cur)) {
        break;
      }
      visited.add(cur);
      chainLeafToRoot.push(cur);

      const parent: string | undefined = criteria[cur]?.nestedFrom;
      if (parent == undefined) break;
      cur = parent;
    }

    const chainRootToLeaf = chainLeafToRoot.slice().reverse();

    const chainIds = new Set(chainRootToLeaf.map((a) => `${a}.id`));

    const existingOther = select.filter((s) => !chainIds.has(s));

    const orderedChain = Array.from(chainIds);
    const nextSelect = [...orderedChain, ...existingOther];

    if (mutate) {
      select.length = 0;
      nextSelect.forEach((s) => select.push(s));
      return select;
    }

    return nextSelect;
  }
}
