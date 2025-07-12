import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { getDepartmentSelectableFields } from '@/department/helper/department-fields.util';
import { COUNTRIES } from '@/lib/const/countries.const';
import { EXAMPLE_DEPARTMENT_ID } from '@/lib/const/department.const';
import { EXAMPLE_ROLE_ID } from '@/lib/const/role.const';
import {
  EXAMPLE_USER_EMAIL,
  EXAMPLE_USER_FIRST_NAME,
  EXAMPLE_USER_ID,
  EXAMPLE_USER_LAST_NAME,
} from '@/lib/const/user.const';
import { getRoleSelectableFields } from '@/role/helper/role-fields.util';
import { getUserSelectableFields } from '@/user/helper/user-fields.util';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsString,
  IsUUID,
} from 'class-validator';
import { UUID } from 'crypto';

/**
 * DTO containing individual filter parameters for user queries.
 *
 * Supports flexible filtering with multiple values per field for bulk operations
 * and optional boolean filters for account status. All filters are optional
 * and can be combined for complex search scenarios.
 */
export class UserQueryParametersDto {
  @ApiPropertyOptional({
    description: 'Filter by specific user UUIDs for bulk operations',
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
    description:
      'Filter by first names - supports partial matching across multiple names',
    example: [EXAMPLE_USER_FIRST_NAME],
    type: String,
    isArray: true,
    maxItems: 100,
  })
  @IsString({ each: true })
  @IsArray()
  firstNames?: string[];

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
  lastNames?: string[];

  @ApiPropertyOptional({
    description:
      'Filter by email addresses - commonly used for user lookup and verification',
    example: [EXAMPLE_USER_EMAIL],
    type: String,
    isArray: true,
    format: 'email',
    uniqueItems: true,
    maxItems: 50,
  })
  @IsEmail({}, { each: true })
  @IsArray()
  emails?: string[];

  @ApiPropertyOptional({
    description:
      'Filter by account activation status - false excludes suspended users',
    example: true,
    type: Boolean,
    default: undefined,
  })
  @IsBoolean()
  isActive?: boolean | undefined;

  @ApiPropertyOptional({
    description:
      'Filter by email verification status - critical for security workflows',
    example: true,
    type: Boolean,
    default: undefined,
  })
  @IsBoolean()
  isEmailVerified?: boolean | undefined;

  @ApiPropertyOptional({
    description: 'Filter by specific departments UUIDs for bulk operations',
    type: String,
    isArray: true,
    example: [EXAMPLE_DEPARTMENT_ID],
    format: 'uuid',
    uniqueItems: true,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  departmentIds?: UUID[];

  @ApiPropertyOptional({
    description: 'Filter by specific departments countries for bulk operations',
    type: String,
    isArray: true,
    example: [COUNTRIES.DE],
    enum: COUNTRIES,
    uniqueItems: true,
  })
  @IsArray()
  @IsEnum(COUNTRIES, { each: true })
  departmentCountries?: string[];

  @ApiPropertyOptional({
    description: 'Filter by specific user UUIDs for bulk operations',
    type: String,
    isArray: true,
    example: [EXAMPLE_ROLE_ID],
    format: 'uuid',
    uniqueItems: true,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: UUID[];

  constructor(
    ids?: UUID[],
    firstNames?: string[],
    lastNames?: string[],
    emails?: string[],
    isActive?: boolean,
    isEmailVerified?: boolean,
    departmentIds?: UUID[],
    departmentCountries?: string[],
    roleIds?: UUID[],
  ) {
    this.ids = ids ?? [];
    this.firstNames = firstNames ?? [];
    this.lastNames = lastNames ?? [];
    this.emails = emails ?? [];
    this.isActive = isActive ?? undefined;
    this.isEmailVerified = isEmailVerified ?? undefined;
    this.departmentIds = departmentIds ?? [];
    this.departmentCountries = departmentCountries ?? [];
    this.roleIds = roleIds ?? [];
  }
}

/**
 * Comprehensive DTO for user query operations combining filters, pagination, sorting, and field selection.
 *
 * Orchestrates complex user searches by combining multiple query parameters with
 * pagination controls, sorting options, and selective field retrieval for optimal
 * performance and flexible API responses.
 */
export class UserQueryDto {
  @ApiProperty({
    description: 'Search criteria and filters for matching users',
    type: () => UserQueryParametersDto,
    required: false,
  })
  @Type(() => UserQueryParametersDto)
  query: UserQueryParametersDto;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include Department in the response',
    default: false,
    required: false,
  })
  @IsBoolean()
  includeDepartment?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include Roles in the response',
    default: false,
    required: false,
  })
  @IsBoolean()
  includeRoles?: boolean;

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
      'Specific user fields to return - optimizes payload size and performance',
    enum: getUserSelectableFields(),
    type: String,
    isArray: true,
    required: false,
    example: getUserSelectableFields(),
  })
  @IsEnum(getUserSelectableFields(), { each: true })
  selectUserFields?: string[];

  @ApiProperty({
    description:
      'Specific user department fields to return - optimizes payload size and performance',
    enum: getDepartmentSelectableFields(),
    type: String,
    isArray: true,
    required: false,
    example: getDepartmentSelectableFields(),
  })
  @IsEnum(getDepartmentSelectableFields(), { each: true })
  selectDepartmentFields?: string[];

  @ApiProperty({
    description:
      'Specific user roles fields to return - optimizes payload size and performance',
    enum: getRoleSelectableFields(),
    type: String,
    isArray: true,
    required: false,
    example: getRoleSelectableFields(),
  })
  @IsEnum(getRoleSelectableFields(), { each: true })
  selectRoleFields?: string[];

  constructor(
    query: UserQueryParametersDto,
    pagination: PaginationDto,
    sort: SortDto,
    selectUserFields: string[],
    selectDepartmentFields: string[],
    selectRoleFields: string[],
    includeDepartment: boolean,
    includeRoles: boolean,
  ) {
    this.query = query;
    this.pagination = pagination;
    this.sort = sort;
    this.selectUserFields = selectUserFields;
    this.selectDepartmentFields = selectDepartmentFields;
    this.selectRoleFields = selectRoleFields;
    this.includeDepartment = includeDepartment;
    this.includeRoles = includeRoles;
  }
}
