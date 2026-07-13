import {
  PaginatedResponseDto,
  PaginationDto,
  SortDto,
} from '@/baseDto/pagination.dto';
import { CacheService } from '@/baseServices/cache.service';
import { hashObject } from '@/utils/token-generator.util';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { isEmpty } from 'class-validator';
import {
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  SelectQueryBuilder,
} from 'typeorm';

type QueryField<T extends ObjectLiteral> =
  | Extract<keyof T, string>
  | `${string}.${string}`;

/**
 * Base service providing reusable TypeORM query building utilities.
 *
 * Centralizes common query patterns to ensure consistency across all entity services
 * and reduces code duplication. Implements a fluent interface for building complex
 * database queries with proper parameter binding to prevent SQL injection.
 */
@Injectable()
export class EntityQueryService {
  constructor(
    @InjectEntityManager()
    protected entityManager: EntityManager,
    private readonly cacheService: CacheService,
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
    field: QueryField<T>;
    values: unknown[] | undefined;
    condition: 'OR' | 'AND';
    relationAlias?: string;
  }): void {
    if (!values || values.length === 0) return;

    const alias = relationAlias ?? query.alias;
    const fieldPath = this.resolveFieldPath({ alias, field });
    const parameterKey = `${alias}_${this.getFieldParameterSuffix(field)}s`;

    if (condition === 'OR') {
      query.orWhere(`${fieldPath} IN (:...${parameterKey})`, {
        [parameterKey]: values,
      });
    } else {
      query.andWhere(`${fieldPath} IN (:...${parameterKey})`, {
        [parameterKey]: values,
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
    field: QueryField<T>;
    value: unknown;
    condition: 'OR' | 'AND';
    relationAlias?: string;
  }): void {
    if (value == undefined) return;

    const alias = relationAlias ?? query.alias;
    const fieldPath = this.resolveFieldPath({ alias, field });
    const parameterKey = `${alias}_${this.getFieldParameterSuffix(field)}_to`;

    if (condition === 'OR') {
      query.orWhere(`${fieldPath} = :${parameterKey}`, {
        [parameterKey]: value,
      });
    } else {
      query.andWhere(`${fieldPath} = :${parameterKey}`, {
        [parameterKey]: value,
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
    const fieldPath = this.resolveFieldPath({ alias, field });
    const parameterKey = `${alias}_${this.getFieldParameterSuffix(field)}_from`;

    if (condition === 'OR') {
      query.orWhere(`${fieldPath} > :${parameterKey}`, {
        [parameterKey]: date,
      });

      return;
    }

    query.andWhere(`${fieldPath} > :${parameterKey}`, {
      [parameterKey]: date,
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
    const fieldPath = this.resolveFieldPath({ alias, field });
    const parameterKey = `${alias}_${this.getFieldParameterSuffix(field)}`;

    if (condition === 'OR') {
      query.orWhere(`${fieldPath} < :${parameterKey}`, {
        [parameterKey]: date,
      });

      return;
    }

    query.andWhere(`${fieldPath} < :${parameterKey}`, {
      [parameterKey]: date,
    });
  }

  private resolveFieldPath({
    alias,
    field,
  }: {
    alias: string;
    field: string;
  }): string {
    return field.includes('.') ? field : `${alias}.${field}`;
  }

  private getFieldParameterSuffix(field: string): string {
    return field.replace(/\W/g, '_');
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

  async getAll<T extends ObjectLiteral>({
    query,
  }: {
    query: SelectQueryBuilder<T>;
  }): Promise<T[]> {
    const batchQuery = query.clone();

    const response = new Array<T>();
    const batchSize = 100;
    let offset = 0;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      batchQuery.skip(offset).take(batchSize);

      const result = await batchQuery.getMany();

      if (isEmpty(result)) {
        break;
      }

      response.push(...result);

      if (result.length < batchSize) {
        break;
      }

      offset += batchSize;
    }

    return response;
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

    const metadata = query.expressionMap.mainAlias?.metadata;
    if (!metadata) return;

    const column = metadata.findColumnWithPropertyName(sortField);
    if (!column) return;

    query.orderBy(`${query.alias}.${sortField}`, sortOrder);
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

  async paginatedResult<T extends ObjectLiteral>({
    query,
    cache,
  }: {
    query: SelectQueryBuilder<T>;
    cache?: boolean | undefined;
  }): Promise<PaginatedResponseDto & { data: T[] }> {
    const page = query.expressionMap.skip ?? 0;
    const limit = query.expressionMap.take ?? 10;

    query.distinct(true);

    const { alias } = query;

    const cacheKey = `${alias}_paginated_${hashObject(query.getQueryAndParameters())}`;

    const cached = await this.cacheService.get<
      PaginatedResponseDto & { data: T[] }
    >(cacheKey);

    if (cached) {
      return cached;
    }

    if (cache === true) {
      return await this.cacheService.coalesce<
        PaginatedResponseDto & { data: T[] }
      >({
        key: cacheKey,
        operation: async () => {
          const users = await query.getManyAndCount();

          const [items, totalCount] = users;
          const res = {
            page: page / limit + 1,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            data: items,
          } as PaginatedResponseDto & { data: T[] };

          await this.cacheService.set<PaginatedResponseDto & { data: T[] }>({
            key: cacheKey,
            value: res,
          });

          return res;
        },
      });
    }

    const [items, totalCount] = await query.getManyAndCount();

    return {
      page: page / limit + 1,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      data: items,
    } as PaginatedResponseDto & { data: T[] };
  }
}
