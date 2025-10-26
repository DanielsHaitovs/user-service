import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import {
  EXAMPLE_PERMISSION_CODE,
  EXAMPLE_PERMISSION_ID,
  EXAMPLE_PERMISSION_NAME,
  EXAMPLE_ROLE_ID,
} from '@/lib/const/role.const';
import {
  getPermissionsGenericSelectableFields,
  getRoleGenericSelectableFields,
} from '@/role/helper/role-fields.util';
import { getUserSelectableFields } from '@/user/helper/user-fields.util';
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

  @ApiPropertyOptional({
    description: 'Filter by IDs of users who created the roles',
    type: String,
    isArray: true,
    example: [EXAMPLE_ROLE_ID],
    format: 'uuid',
    uniqueItems: true,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  createdByIds?: UUID[];

  constructor(ids?: UUID[], names?: string[], createdByIds?: UUID[]) {
    this.ids = ids ?? [];
    this.names = names ?? [];
    this.createdByIds = createdByIds ?? [];
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

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include created by user in the response',
    default: false,
    required: false,
  })
  @IsBoolean()
  includeCreatedBy?: boolean;

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
  order?: SortDto;

  @ApiProperty({
    description:
      'Specific role fields to return - optimizes payload size and performance',
    enum: getRoleGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getRoleGenericSelectableFields({}),
  })
  @IsEnum(getRoleGenericSelectableFields({}), { each: true })
  selectRoles?: string[];

  @ApiProperty({
    description:
      'Specific permission fields to return - optimizes payload size and performance',
    enum: getPermissionsGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getPermissionsGenericSelectableFields({}),
  })
  @IsEnum(getPermissionsGenericSelectableFields({}), { each: true })
  selectPermissions?: string[];

  @ApiProperty({
    description:
      'Specific user fields to return - optimizes payload size and performance',
    enum: getUserSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getUserSelectableFields({}),
  })
  @IsEnum(getUserSelectableFields({}), { each: true })
  selectCreatedBy?: string[];

  constructor(
    rolesQuery: RoleQueryParametersDto,
    permissionsQuery: PermissionQueryParametersDto,
    pagination: PaginationDto,
    includePermissions: boolean,
    includeCreatedBy: boolean,
    order: SortDto,
    selectRoles: string[],
    selectPermissions: string[],
    selectCreatedBy: string[],
  ) {
    this.rolesQuery = rolesQuery;
    this.permissionsQuery = permissionsQuery;
    this.includePermissions = includePermissions;
    this.includeCreatedBy = includeCreatedBy;
    this.pagination = pagination;
    this.order = order;
    this.selectRoles = selectRoles;
    this.selectPermissions = selectPermissions;
    this.selectCreatedBy = selectCreatedBy;
  }
}
