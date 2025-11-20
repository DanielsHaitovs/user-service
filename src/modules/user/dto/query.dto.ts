import { PaginationDto, QueryDateRequestDto } from '@/base/dto/pagination.dto';
import { ToArray } from '@/common/decorators/array.decorator';
import { ToBoolean } from '@/common/decorators/boolean.decorator';
import { getDepartmentGenericSelectableFields } from '@/department/helper/department-fields.util';
import { COUNTRIES } from '@/lib/const/countries.const';
import {
  getPermissionsGenericSelectableFields,
  getRoleGenericSelectableFields,
} from '@/role/helper/role-fields.util';
import {
  getUserGenericSelectableFields,
  getUserRoleGenericSelectableFields,
} from '@/user/helper/user-fields.util';
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';

import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
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
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
  })
  @ToArray()
  @IsOptional()
  @IsUUID('4', { each: true, message: 'Each id must be a valid UUIDv4' })
  ids: UUID[] | undefined;

  @ApiPropertyOptional({
    description:
      'Filter by first names - supports partial matching across multiple names',
    type: String,
    isArray: true,
    maxItems: 100,
  })
  @IsString({ each: true })
  @ToArray()
  @IsOptional()
  firstNames: string[] | undefined;

  @ApiPropertyOptional({
    description:
      'Filter by last names - useful for family or surname-based searches',
    type: String,
    isArray: true,
    maxItems: 100,
  })
  @IsString({ each: true })
  @ToArray()
  @IsOptional()
  lastNames: string[] | undefined;

  @ApiPropertyOptional({
    description:
      'Filter by email addresses - commonly used for user lookup and verification',
    type: String,
    isArray: true,
    format: 'email',
    uniqueItems: true,
    maxItems: 50,
  })
  @IsEmail({}, { each: true })
  @ToArray()
  @IsOptional()
  emails: string[] | undefined;

  @ApiPropertyOptional({
    description: 'Filter by phone numbers - supports multiple contact methods',
    type: String,
    isArray: true,
    format: 'phone',
    uniqueItems: true,
    maxItems: 50,
  })
  @IsString({ each: true })
  @ToArray()
  @IsOptional()
  phoneNumbers: string[] | undefined;

  @ApiPropertyOptional({
    description:
      'Filter by account activation status - false excludes suspended users',
    type: Boolean,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive: boolean | undefined;

  @ApiPropertyOptional({
    description:
      'Filter by account email verification status - false excludes unverified users',
    type: Boolean,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isEmailVerified: boolean | undefined;

  @ApiPropertyOptional({
    description: 'Filter by specific created by UUIDs for bulk operations',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
  })
  @ToArray()
  @IsOptional()
  @IsUUID('4', {
    each: true,
    message: 'Each departmentId must be a valid UUIDv4',
  })
  createdByIds: UUID[] | undefined;

  @ApiPropertyOptional({
    description: 'Filter by specific departments UUIDs for bulk operations',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
  })
  @ToArray()
  @IsOptional()
  @IsUUID('4', {
    each: true,
    message: 'Each departmentId must be a valid UUIDv4',
  })
  departmentIds: UUID[] | undefined;

  @ApiPropertyOptional({
    description: 'Filter by specific departments countries for bulk operations',
    type: String,
    isArray: true,
    enum: COUNTRIES,
    uniqueItems: true,
  })
  @ToArray()
  @IsOptional()
  @IsEnum(COUNTRIES, { each: true })
  departmentCountries: string[] | undefined;

  @ApiPropertyOptional({
    description: 'Filter by specific role UUIDs for bulk operations',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
  })
  @ToArray()
  @IsOptional()
  @IsUUID('4', { each: true, message: 'Each roleId must be a valid UUIDv4' })
  roleIds: UUID[] | undefined;

  @ApiPropertyOptional({
    description: 'Filter by specific role names for bulk operations',
    type: String,
    isArray: true,
    uniqueItems: true,
  })
  @ToArray()
  @IsOptional()
  @IsString({ each: true })
  roleNames: string[] | undefined;

  @ApiPropertyOptional({
    description: 'Filter by specific permission UUIDs for bulk operations',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
  })
  @ToArray()
  @IsOptional()
  @IsUUID('4', {
    each: true,
    message: 'Each permissionId must be a valid UUIDv4',
  })
  permissionIds: UUID[] | undefined;

  @ApiPropertyOptional({
    description: 'Filter by specific permission codes for bulk operations',
    type: String,
    isArray: true,
    uniqueItems: true,
  })
  @ToArray()
  @IsOptional()
  @IsString({ each: true })
  permissionCodes: string[] | undefined;

  constructor(
    ids: UUID[],
    firstNames?: string[],
    lastNames?: string[],
    emails?: string[],
    phoneNumbers?: string[],
    isActive?: boolean,
    isEmailVerified?: boolean,
    createdByIds?: UUID[],
    departmentIds?: UUID[],
    departmentCountries?: string[],
    roleIds?: UUID[],
    roleNames?: string[],
    permissionIds?: UUID[],
    permissionCodes?: string[],
  ) {
    this.ids = ids;
    this.firstNames = firstNames;
    this.lastNames = lastNames;
    this.phoneNumbers = phoneNumbers;
    this.emails = emails;
    this.isActive = isActive;
    this.isEmailVerified = isEmailVerified;
    this.createdByIds = createdByIds;
    this.departmentIds = departmentIds;
    this.departmentCountries = departmentCountries;
    this.roleIds = roleIds;
    this.roleNames = roleNames;
    this.permissionIds = permissionIds;
    this.permissionCodes = permissionCodes;
  }
}

export class UserSelectDto {
  @ApiPropertyOptional({
    description:
      'Specific user fields to return - optimizes payload size and performance',
    enum: getUserGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getUserGenericSelectableFields({}),
  })
  @ToArray()
  @IsEnum(getUserGenericSelectableFields({}), {
    each: true,
    message: 'Each selectUserField must be a valid user field',
  })
  @IsOptional()
  selectUserFields: string[];

  constructor(selectUserFields: string[] | undefined) {
    this.selectUserFields = selectUserFields ?? [];
  }
}

export class UserRelationSelectDto extends UserSelectDto {
  @ApiPropertyOptional({
    description:
      'Specific user department fields to return - optimizes payload size and performance',
    enum: getDepartmentGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getDepartmentGenericSelectableFields({}),
  })
  @ToArray()
  @IsEnum(getDepartmentGenericSelectableFields({}), {
    each: true,
    message: 'Each selectDepartmentField must be a valid department field',
  })
  @IsOptional()
  selectDepartmentFields: string[];

  @ApiPropertyOptional({
    description:
      'Specific user fields to return - optimizes payload size and performance',
    enum: getUserRoleGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getUserRoleGenericSelectableFields({}),
  })
  @ToArray()
  @IsEnum(getUserRoleGenericSelectableFields({}), {
    each: true,
    message: 'Each selectUserRoleField must be a valid user role field',
  })
  @IsOptional()
  selectUserRoleFields: string[];

  @ApiPropertyOptional({
    description:
      'Specific user roles fields to return - optimizes payload size and performance',
    enum: getRoleGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getRoleGenericSelectableFields({}),
  })
  @ToArray()
  @IsEnum(getRoleGenericSelectableFields({}), {
    each: true,
    message: 'Each selectRoleField must be a valid role field',
  })
  @IsOptional()
  selectRoleFields: string[];

  @ApiPropertyOptional({
    description:
      'Specific role permission fields to return - optimizes payload size and performance',
    enum: getPermissionsGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getPermissionsGenericSelectableFields({}),
  })
  @IsOptional()
  @ToArray()
  @IsEnum(getPermissionsGenericSelectableFields({}), {
    each: true,
    message: 'Each selectPermissionField must be a valid permission field',
  })
  selectPermissionFields: string[];

  constructor({
    selectUserFields,
    selectDepartmentFields,
    selectUserRoleFields,
    selectRoleFields,
    selectPermissionFields,
  }: {
    selectUserFields: string[] | undefined;
    selectDepartmentFields: string[] | undefined;
    selectUserRoleFields: string[] | undefined;
    selectRoleFields: string[] | undefined;
    selectPermissionFields: string[] | undefined;
  }) {
    super(selectUserFields);
    this.selectDepartmentFields = selectDepartmentFields ?? [];
    this.selectUserRoleFields = selectUserRoleFields ?? [];
    this.selectRoleFields = selectRoleFields ?? [];
    this.selectPermissionFields = selectPermissionFields ?? [];
  }
}

export class UserQueryResponseControlDto extends UserRelationSelectDto {
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include Created By in the response',
    default: false,
    required: false,
  })
  @ToBoolean()
  @IsBoolean()
  includeCreatedBy: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include Department in the response',
    default: false,
    required: false,
  })
  @ToBoolean()
  @IsBoolean()
  includeDepartments: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include Roles in the response',
    default: false,
    required: false,
  })
  @IsBoolean()
  @ToBoolean()
  includeRoles: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include Permissions in the response',
    default: false,
    required: false,
  })
  @ToBoolean()
  @IsBoolean()
  includePermissions: boolean;

  constructor(
    includeCreatedBy: boolean,
    includeDepartments: boolean,
    includeRoles: boolean,
    includePermissions: boolean,
    selectUserFields: string[] | undefined,
    selectDepartmentFields: string[] | undefined,
    selectUserRoleFields: string[] | undefined,
    selectRoleFields: string[] | undefined,
    selectPermissionFields: string[] | undefined,
  ) {
    super({
      selectUserFields,
      selectDepartmentFields,
      selectUserRoleFields,
      selectRoleFields,
      selectPermissionFields,
    });
    this.includeCreatedBy = includeCreatedBy;
    this.includeDepartments = includeDepartments;
    this.includeRoles = includeRoles;
    this.includePermissions = includePermissions;
  }
}

export class UserSortDto {
  @ApiPropertyOptional({
    description: 'Entity field name to sort results by',
    enum: getUserGenericSelectableFields({}),
    type: String,
    required: false,
  })
  @IsEnum(getUserGenericSelectableFields({}), {
    each: true,
    message: 'sortField must be a valid user field',
  })
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

export class UserDateRequestDto extends QueryDateRequestDto {
  @ApiPropertyOptional({
    description: 'Additional date filter parameter for custom filtering logic',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'dateOfBirth'],
    type: String,
  })
  @IsEnum(['createdAt', 'updatedAt', 'dateOfBirth'], {
    message: 'dateFilterParam must be a valid user date field',
    each: true,
  })
  @IsOptional()
  dateFilterParam: string | undefined;

  constructor(
    dateFilterParam: string | undefined,
    dateFrom: Date | undefined,
    dateTo: Date | undefined,
  ) {
    super(dateFrom, dateTo);
    this.dateFilterParam = dateFilterParam;
  }
}

export interface UserRequestI {
  responseControl: UserQueryResponseControlDto;
  sort: UserSortDto;
  pagination: PaginationDto;
}

export class UserRequestDto extends IntersectionType(
  PaginationDto,
  UserSortDto,
  UserQueryResponseControlDto,
) {}

export class GetUsersByIdsRequestDto extends UserRequestDto {
  @ApiProperty({
    description: 'Filter by specific user UUIDs for bulk operations',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
    nullable: false,
  })
  @ToArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true, message: 'Each id must be a valid UUIDv4' })
  ids: UUID[];

  constructor(ids: UUID[]) {
    super();
    this.ids = ids;
  }
}

export class GetUsersByEmailsRequestDto extends UserRequestDto {
  @ApiPropertyOptional({
    description:
      'Filter by email addresses - commonly used for user lookup and verification',
    type: String,
    isArray: true,
    nullable: false,
    format: 'email',
    uniqueItems: true,
    maxItems: 50,
  })
  @IsEmail({}, { each: true })
  @ToArray()
  @IsNotEmpty()
  emails: string[];

  constructor(emails: string[]) {
    super();
    this.emails = emails;
  }
}

export class UserSearchRequestDto extends IntersectionType(
  PaginationDto,
  UserSortDto,
  UserSelectDto,
) {}

export interface UserQuery extends UserQueryResponseControlDto {
  query: UserQueryParametersDto;
  dateQuery: UserDateRequestDto;
  sort: UserSortDto;
  pagination: PaginationDto;
}

export class FilterUsersQueryDto extends IntersectionType(
  UserQueryParametersDto,
  UserDateRequestDto,
  UserQueryResponseControlDto,
  PaginationDto,
  UserSortDto,
) {}
