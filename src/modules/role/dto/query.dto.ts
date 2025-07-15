import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import {
  EXAMPLE_PERMISSION_CODE,
  EXAMPLE_PERMISSION_ID,
  EXAMPLE_PERMISSION_NAME,
  EXAMPLE_ROLE_ID,
} from '@/lib/const/role.const';
import {
  getPermissionsSelectableFields,
  getRoleSelectableFields,
} from '@/role/helper/role-fields.util';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsString,
  IsUUID,
} from 'class-validator';
import { UUID } from 'crypto';

export class FindPermissionsByIdsQueryDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  @Type(() => String)
  ids: string[];

  constructor(ids: UUID[]) {
    this.ids = ids;
  }
}

/**
 * DTO containing individual filter parameters for role queries.
 *
 * Supports flexible filtering with multiple values per field for bulk operations
 * and optional boolean filters for account status. All filters are optional
 * and can be combined for complex search scenarios.
 */
export class RoleQueryParametersDto {
  @ApiPropertyOptional({
    description: 'Filter by specific roles UUIDs for bulk operations',
    type: String,
    isArray: true,
    example: [EXAMPLE_ROLE_ID],
    format: 'uuid',
    uniqueItems: true,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  ids?: UUID[];

  @ApiPropertyOptional({
    description:
      'Filter by role names - supports partial matching across multiple names',
    example: ['Admin', 'User'],
    type: String,
    isArray: true,
    maxItems: 100,
  })
  @IsString({ each: true })
  @IsArray()
  names?: string[];

  constructor(ids?: UUID[], names?: string[]) {
    this.ids = ids ?? [];
    this.names = names ?? [];
  }
}

/**
 * DTO containing individual filter parameters for permission queries.
 *
 * Supports flexible filtering with multiple values per field for bulk operations
 * and optional boolean filters for account status. All filters are optional
 * and can be combined for complex search scenarios.
 */
export class PermissionQueryParametersDto {
  @ApiPropertyOptional({
    description: 'Filter by specific permissions UUIDs for bulk operations',
    type: String,
    isArray: true,
    example: [EXAMPLE_PERMISSION_ID],
    format: 'uuid',
    uniqueItems: true,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  ids?: UUID[];

  @ApiPropertyOptional({
    description:
      'Filter by permission names - supports partial matching across multiple names',
    example: [EXAMPLE_PERMISSION_NAME],
    type: String,
    isArray: true,
    maxItems: 100,
  })
  @IsString({ each: true })
  @IsArray()
  names?: string[];

  @ApiPropertyOptional({
    description:
      'Filter by permission codes - supports partial matching across multiple codes',
    example: [EXAMPLE_PERMISSION_CODE],
    type: String,
    isArray: true,
    maxItems: 100,
  })
  @IsString({ each: true })
  @IsArray()
  codes?: string[];

  constructor(ids?: UUID[], names?: string[]) {
    this.ids = ids ?? [];
    this.names = names ?? [];
  }
}

/**
 * Comprehensive DTO for roles&query query operations combining filters, pagination, sorting, and field selection.
 *
 * Orchestrates complex user searches by combining multiple query parameters with
 * pagination controls, sorting options, and selective field retrieval for optimal
 * performance and flexible API responses.
 */
export class RolesQueryDto {
  @ApiProperty({
    description: 'Search criteria and filters for matching roles',
    type: RoleQueryParametersDto,
    required: false,
  })
  @Type(() => RoleQueryParametersDto)
  rolesQuery: RoleQueryParametersDto;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include permissions in the response',
    default: false,
    required: false,
  })
  @IsBoolean()
  includePermissions?: boolean;

  @ApiProperty({
    description: 'Search criteria and filters for matching roles',
    type: PermissionQueryParametersDto,
    required: false,
  })
  @Type(() => PermissionQueryParametersDto)
  permissionsQuery: PermissionQueryParametersDto;

  @ApiProperty({
    description:
      'Page number and result limit configuration for response size control',
    type: PaginationDto,
    required: false,
  })
  @Type(() => PaginationDto)
  pagination: PaginationDto;

  @ApiProperty({
    description:
      'Field and direction for result ordering - ensures predictable output',
    type: SortDto,
    required: false,
  })
  @Type(() => SortDto)
  sort: SortDto;

  @ApiProperty({
    description:
      'Specific user fields to return - optimizes payload size and performance',
    enum: getRoleSelectableFields(),
    type: String,
    isArray: true,
    required: false,
    example: getRoleSelectableFields(),
  })
  @IsEnum(getRoleSelectableFields(), { each: true })
  selectRoles?: string[];

  @ApiProperty({
    description:
      'Specific user fields to return - optimizes payload size and performance',
    enum: getPermissionsSelectableFields(),
    type: String,
    isArray: true,
    required: false,
    example: getPermissionsSelectableFields(),
  })
  @IsEnum(getPermissionsSelectableFields(), { each: true })
  selectPermissions?: string[];

  constructor(
    rolesQuery: RoleQueryParametersDto,
    permissionsQuery: PermissionQueryParametersDto,
    pagination: PaginationDto,
    includePermissions: boolean,
    sort: SortDto,
    selectRoles: string[],
    selectPermissions: string[],
  ) {
    this.rolesQuery = rolesQuery;
    this.permissionsQuery = permissionsQuery;
    this.includePermissions = includePermissions;
    this.pagination = pagination;
    this.sort = sort;
    this.selectRoles = selectRoles;
    this.selectPermissions = selectPermissions;
  }
}
