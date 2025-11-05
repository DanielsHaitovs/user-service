import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { getDepartmentSelectableFields } from '@/department/helper/department-fields.util';
import {
  EXAMPLE_USER_FIRST_NAME,
  EXAMPLE_USER_ID,
  EXAMPLE_USER_LAST_NAME,
  USER_QUERY_ALIAS,
} from '@/lib/const/user.const';
import {
  getCreatedByGenericSelectableFields,
  getUserGenericSelectableFields,
} from '@/user/helper/user-fields.util';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsString, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

/**
 * DTO containing individual filter parameters for user queries.
 *
 * Supports flexible filtering with multiple values per field for bulk operations
 * and optional boolean filters for account status. All filters are optional
 * and can be combined for complex search scenarios.
 */
export class DepartmentQueryParametersDto {
  @ApiPropertyOptional({
    description: 'Filter by specific deparment UUIDs for bulk operations',
    type: String,
    example: [EXAMPLE_USER_ID],
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  ids?: UUID[];

  @ApiPropertyOptional({
    description: 'Filter by specific deparment UUIDs for bulk operations',
    type: String,
    example: [EXAMPLE_USER_ID],
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: UUID[];

  @ApiPropertyOptional({
    description: 'Filter by specific deparment UUIDs for bulk operations',
    type: String,
    example: [EXAMPLE_USER_ID],
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  createdByUserIds?: UUID[];

  @ApiPropertyOptional({
    description:
      'Filter by department names - supports partial matching across multiple names',
    example: [EXAMPLE_USER_FIRST_NAME],
    type: String,
    isArray: true,
    maxItems: 100,
  })
  @IsString({ each: true })
  @IsArray()
  names?: string[];

  @ApiPropertyOptional({
    description:
      'Filter by last names - useful for family or surname-based searches',
    example: [EXAMPLE_USER_LAST_NAME],
    type: String,
    isArray: true,
    maxItems: 100,
  })
  @IsString({ each: true })
  @IsArray()
  countries?: string[];

  constructor(
    ids?: UUID[],
    names?: string[],
    countries?: string[],
    userIds?: UUID[],
    createdByUserIds?: UUID[],
  ) {
    this.ids = ids ?? [];
    this.names = names ?? [];
    this.countries = countries ?? [];
    this.userIds = userIds ?? [];
    this.createdByUserIds = createdByUserIds ?? [];
  }
}

export class DepartmentQueryDto {
  @ApiProperty({
    description: 'Search criteria and filters for matching users',
    type: () => DepartmentQueryParametersDto,
    required: false,
  })
  @Type(() => DepartmentQueryParametersDto)
  query: DepartmentQueryParametersDto;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include Users in the response',
    default: false,
    required: false,
  })
  @IsBoolean()
  includeUsers?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include Created By Users in the response',
    default: false,
    required: false,
  })
  @IsBoolean()
  includeCreatedBy?: boolean;

  @ApiProperty({
    description:
      'Page number and result limit configuration for response size control',
    type: () => PaginationDto,
    required: false,
  })
  @Type(() => PaginationDto)
  pagination: PaginationDto;

  @ApiProperty({
    description:
      'Field and direction for result ordering - ensures predictable output',
    type: () => SortDto,
    required: false,
  })
  @Type(() => SortDto)
  sort?: SortDto;

  @ApiProperty({
    description:
      'Specific user department fields to return - optimizes payload size and performance',
    enum: getDepartmentSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getDepartmentSelectableFields({}),
  })
  @IsEnum(getDepartmentSelectableFields({}), { each: true })
  selectDepartmentFields?: string[];

  @ApiProperty({
    description:
      'Specific user fields to return - optimizes payload size and performance',
    enum: getUserGenericSelectableFields({ alias: `${USER_QUERY_ALIAS}s` }),
    type: String,
    isArray: true,
    required: false,
    example: getUserGenericSelectableFields({ alias: `${USER_QUERY_ALIAS}s` }),
  })
  @IsEnum(getUserGenericSelectableFields({ alias: `${USER_QUERY_ALIAS}s` }), {
    each: true,
  })
  selectUserFields?: string[];

  @ApiProperty({
    description:
      'Specific user created by fields to return - optimizes payload size and performance',
    enum: getCreatedByGenericSelectableFields(),
    type: String,
    isArray: true,
    required: false,
    example: getCreatedByGenericSelectableFields(),
  })
  @IsEnum(getCreatedByGenericSelectableFields(), { each: true })
  selectUserCreatedByFields?: string[];

  constructor(
    query: DepartmentQueryParametersDto,
    pagination: PaginationDto,
    sort: SortDto,
    selectUserFields: string[],
    selectDepartmentFields: string[],
    selectRoleFields: string[],
    includeCreatedBy: boolean,
    includeUsers: boolean,
  ) {
    this.query = query;
    this.pagination = pagination;
    this.sort = sort;
    this.selectUserFields = selectUserFields;
    this.selectDepartmentFields = selectDepartmentFields;
    this.selectUserCreatedByFields = selectRoleFields;
    this.includeCreatedBy = includeCreatedBy;
    this.includeUsers = includeUsers;
  }
}
