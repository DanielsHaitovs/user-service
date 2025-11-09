import {
  PaginationDto,
  QueryRequestDto,
  SortDto,
} from '@/base/dto/pagination.dto';
import { getDepartmentGenericSelectableFields } from '@/department/helper/department-fields.util';
import { COUNTRIES } from '@/lib/const/countries.const';
import { EXAMPLE_DEPARTMENT_ID } from '@/lib/const/department.const';
import {
  EXAMPLE_PERMISSION_CODE,
  EXAMPLE_PERMISSION_ID,
  EXAMPLE_ROLE_ID,
  EXAMPLE_ROLE_NAME,
} from '@/lib/const/role.const';
import {
  EXAMPLE_USER_EMAIL,
  EXAMPLE_USER_FIRST_NAME,
  EXAMPLE_USER_ID,
  EXAMPLE_USER_LAST_NAME,
  EXAMPLE_USER_PHONE,
} from '@/lib/const/user.const';
import {
  getPermissionsGenericSelectableFields,
  getRoleGenericSelectableFields,
} from '@/role/helper/role-fields.util';
import { getUserGenericSelectableFields } from '@/user/helper/user-fields.util';
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
    description: 'Filter by phone numbers - supports multiple contact methods',
    example: [EXAMPLE_USER_PHONE],
    type: String,
    isArray: true,
    format: 'phone',
    uniqueItems: true,
    maxItems: 50,
  })
  @IsString({ each: true })
  @IsArray()
  phoneNumbers?: string[];

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
      'Filter by account email verification status - false excludes unverified users',
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
    description: 'Filter by specific role UUIDs for bulk operations',
    type: String,
    isArray: true,
    example: [EXAMPLE_ROLE_ID],
    format: 'uuid',
    uniqueItems: true,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: UUID[];

  @ApiPropertyOptional({
    description: 'Filter by specific role names for bulk operations',
    type: String,
    isArray: true,
    example: [EXAMPLE_ROLE_NAME],
    format: 'uuid',
    uniqueItems: true,
  })
  @IsArray()
  @IsString({ each: true })
  roleNames?: string[];

  @ApiPropertyOptional({
    description: 'Filter by specific permission UUIDs for bulk operations',
    type: String,
    isArray: true,
    example: [EXAMPLE_PERMISSION_ID],
    format: 'uuid',
    uniqueItems: true,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: UUID[];

  @ApiPropertyOptional({
    description: 'Filter by specific permission codes for bulk operations',
    type: String,
    isArray: true,
    example: [EXAMPLE_PERMISSION_CODE],
    format: 'uuid',
    uniqueItems: true,
  })
  @IsArray()
  @IsString({ each: true })
  permissionCodes?: string[];

  constructor(
    ids?: UUID[],
    firstNames?: string[],
    lastNames?: string[],
    emails?: string[],
    phoneNumbers?: string[],
    isActive?: boolean,
    isEmailVerified?: boolean,
    departmentIds?: UUID[],
    departmentCountries?: string[],
    roleIds?: UUID[],
    roleNames?: string[],
    permissionIds?: UUID[],
    permissionCodes?: string[],
  ) {
    this.ids = ids ?? [];
    this.firstNames = firstNames ?? [];
    this.lastNames = lastNames ?? [];
    this.phoneNumbers = phoneNumbers ?? [];
    this.emails = emails ?? [];
    this.isActive = isActive ?? undefined;
    this.isEmailVerified = isEmailVerified ?? undefined;
    this.departmentIds = departmentIds ?? [];
    this.departmentCountries = departmentCountries ?? [];
    this.roleIds = roleIds ?? [];
    this.roleNames = roleNames ?? [];
    this.permissionIds = permissionIds ?? [];
    this.permissionCodes = permissionCodes ?? [];
  }
}

/**
 * Comprehensive DTO for user query operations combining filters, pagination, sorting, and field selection.
 *
 * Orchestrates complex user searches by combining multiple query parameters with
 * pagination controls, sorting options, and selective field retrieval for optimal
 * performance and flexible API responses.
 */
export class UserQueryDto extends QueryRequestDto {
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
  includeDepartments?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include Roles in the response',
    default: false,
    required: false,
  })
  @IsBoolean()
  includeRoles?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include Permissions in the response',
    default: false,
    required: false,
  })
  @IsBoolean()
  includePermissions?: boolean;

  @ApiProperty({
    description:
      'Specific user fields to return - optimizes payload size and performance',
    enum: getUserGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getUserGenericSelectableFields({}),
  })
  @IsEnum(getUserGenericSelectableFields({}), { each: true })
  selectUserFields?: string[];

  @ApiProperty({
    description:
      'Specific user fields to return - optimizes payload size and performance',
    enum: getUserGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getUserGenericSelectableFields({}),
  })
  @IsEnum(getUserGenericSelectableFields({}), { each: true })
  selectUserRoleFields?: string[];

  @ApiProperty({
    description:
      'Specific user department fields to return - optimizes payload size and performance',
    enum: getDepartmentGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getDepartmentGenericSelectableFields({}),
  })
  @IsEnum(getDepartmentGenericSelectableFields({}), { each: true })
  selectDepartmentFields?: string[];

  @ApiProperty({
    description:
      'Specific user roles fields to return - optimizes payload size and performance',
    enum: getRoleGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getRoleGenericSelectableFields({}),
  })
  @IsEnum(getRoleGenericSelectableFields({}), { each: true })
  selectRoleFields?: string[];

  @ApiProperty({
    description:
      'Specific role permission fields to return - optimizes payload size and performance',
    enum: getPermissionsGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getPermissionsGenericSelectableFields({}),
  })
  @IsEnum(getPermissionsGenericSelectableFields({}), { each: true })
  selectPermissionFields?: string[];

  constructor(
    query: UserQueryParametersDto,
    pagination: PaginationDto,
    sort: SortDto,
    selectUserFields: string[],
    selectDepartmentFields: string[],
    selectUserRoleFields: string[],
    selectRoleFields: string[],
    selectPermissionFields: string[],
    includeDepartments: boolean,
    includeRoles: boolean,
    includePermissions: boolean,
  ) {
    super(pagination, sort);
    this.query = query;
    this.selectUserFields = selectUserFields;
    this.selectDepartmentFields = selectDepartmentFields;
    this.selectUserRoleFields = selectUserRoleFields;
    this.selectRoleFields = selectRoleFields;
    this.selectPermissionFields = selectPermissionFields;
    this.includeDepartments = includeDepartments;
    this.includeRoles = includeRoles;
    this.includePermissions = includePermissions;
  }
}
