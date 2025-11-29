import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

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
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Page number must be at least 1' })
  @IsNumber()
  page: number;

  @ApiProperty({
    description: 'Number of records to return per page (performance limited)',
    example: 10,
    type: Number,
    minimum: 1,
    maximum: 5000,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Pagelimit must be at least 1' })
  @IsNumber()
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
  @ApiPropertyOptional({
    description: 'Entity field name to sort results by',
    example: 'createdAt',
    type: String,
  })
  @IsString()
  @IsOptional()
  sortField: string | undefined;

  @ApiPropertyOptional({
    description: 'Sort direction for result ordering',
    example: 'ASC',
    enum: ['ASC', 'DESC'],
    type: String,
    default: 'ASC',
  })
  @IsEnum(['ASC', 'DESC'], {
    message: 'sortOrder must be either ASC or DESC',
    each: true,
  })
  sortOrder: 'ASC' | 'DESC';

  constructor(
    sortField: string | undefined,
    sortOrder: 'ASC' | 'DESC' | undefined,
  ) {
    this.sortField = sortField;
    this.sortOrder = sortOrder ?? 'ASC';
  }
}

export class QueryDateRequestDto {
  @ApiPropertyOptional({
    description: 'Additional date filter parameter for custom filtering logic',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt'],
    type: String,
  })
  @IsEnum(['createdAt', 'updatedAt'], {
    message: 'dateFilterParam must be a valid department date field',
    each: true,
  })
  @IsOptional()
  dateFilterParam?: string | undefined;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date | undefined;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date | undefined;

  constructor(
    dateFrom: Date | undefined,
    dateTo: Date | undefined,
    dateFilterParam?: string,
  ) {
    this.dateFrom = dateFrom;
    this.dateTo = dateTo;
    this.dateFilterParam = dateFilterParam;
  }
}

export class QueryRequestDto {
  @ApiProperty({
    description:
      'Pagination parameters to control page size and number of results',
    type: PaginationDto,
    required: true,
  })
  @Type(() => PaginationDto)
  @ValidateNested()
  pagination: PaginationDto;

  @ApiProperty({
    description:
      'Pagination parameters to control page size and number of results',
    type: SortDto,
    required: true,
  })
  @Type(() => SortDto)
  @ValidateNested()
  sort: SortDto;

  @ApiPropertyOptional({
    description: 'Filter results created from this date onwards',
    type: Date,
    required: false,
  })
  dateFrom?: Date | undefined;

  @ApiPropertyOptional({
    description: 'Filter results created up to this date',
    type: Date,
    required: false,
  })
  dateTo?: Date | undefined;

  @ApiPropertyOptional({
    description: 'Additional date filter parameter for custom filtering logic',
    type: String,
    required: false,
  })
  @IsString()
  dateFilterParam?: string | undefined;

  constructor(
    pagination: PaginationDto,
    sort: SortDto,
    dateFrom?: Date,
    dateTo?: Date,
    dateFilterParam?: string,
  ) {
    this.pagination = pagination;
    this.sort = sort;
    this.dateFilterParam = dateFilterParam;
    this.dateFrom = dateFrom;
    this.dateTo = dateTo;
  }
}
