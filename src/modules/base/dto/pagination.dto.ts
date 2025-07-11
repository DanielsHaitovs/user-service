import { ApiProperty } from '@nestjs/swagger';

import { IsNumber, Min } from 'class-validator';

/**
 * Base response wrapper for paginated API endpoints providing metadata about result sets.
 *
 * Implements standard pagination metadata pattern used across all paginated responses
 * to ensure consistent client-side pagination implementation and navigation controls.
 * Calculates total pages automatically based on record count and page size.
 */
export class PaginatedResponseDto {
  @ApiProperty({
    description: 'Total number of records matching the query criteria',
    example: 150,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'Current page number in the pagination sequence',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @Min(1)
  @IsNumber()
  page: number;

  @ApiProperty({
    description: 'Maximum number of records returned per page',
    example: 10,
    type: Number,
    minimum: 1,
    maximum: 1000,
  })
  @IsNumber()
  @Min(1)
  limit: number;

  @ApiProperty({
    description:
      'Total number of pages available based on record count and page size',
    example: 15,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  totalPages: number;

  constructor(total: number, page: number, limit: number, totalPages: number) {
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = totalPages;
  }
}

/**
 * Request DTO for pagination parameters in API queries.
 *
 * Standardizes pagination input across all list endpoints to ensure consistent
 * behavior and prevent performance issues from oversized result sets. Enforces
 * minimum values to maintain API reliability and reasonable response times.
 */
export class PaginationDto {
  @ApiProperty({
    description: 'Page number to retrieve (1-based indexing)',
    example: 1,
    type: Number,
    minimum: 1,
    default: 1,
  })
  @Min(1)
  @IsNumber()
  page: number;

  @ApiProperty({
    description: 'Number of records to return per page (performance limited)',
    example: 10,
    type: Number,
    minimum: 1,
    maximum: 1000,
    default: 10,
  })
  @IsNumber()
  @Min(1)
  limit: number;

  constructor(page: number, limit: number) {
    this.page = page;
    this.limit = limit;
  }
}

/**
 * DTO for sorting configuration in list queries.
 *
 * Provides standardized sorting controls across all list endpoints to ensure
 * predictable result ordering and consistent API behavior. Supports both
 * ascending and descending sort orders for flexible data presentation.
 */
export class SortDto {
  @ApiProperty({
    description: 'Entity field name to sort results by',
    example: 'createdAt',
    type: String,
  })
  sortField: string;

  @ApiProperty({
    description: 'Sort direction for result ordering',
    example: 'ASC',
    enum: ['ASC', 'DESC'],
    type: String,
    default: 'ASC',
  })
  sortOrder: 'ASC' | 'DESC';

  constructor(sortField: string, sortOrder: 'ASC' | 'DESC') {
    this.sortField = sortField;
    this.sortOrder = sortOrder;
  }
}
