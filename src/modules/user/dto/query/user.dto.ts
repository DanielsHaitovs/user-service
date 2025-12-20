import { PaginationDto, QueryDateRequestDto } from '@/baseDto/pagination.dto';
import { ToArray } from '@/commonDecorators/array.decorator';
import { ToBoolean } from '@/commonDecorators/boolean.decorator';
import { getDepartmentGenericSelectableFields } from '@/departmentHelper/department-fields.util';
import { COUNTRIES } from '@/lib/countries.const';
import {
  getPermissionsGenericSelectableFields,
  getRoleGenericSelectableFields,
} from '@/roleHelper/role-fields.util';
import { UserDateParams } from '@/userEnum/user.enum';
import {
  getAssignedByGenericSelectableFields,
  getCreatedByGenericSelectableFields,
  getUserDepartmentGenericSelectableFields,
  getUserGenericSelectableFields,
  getUserRoleGenericSelectableFields,
} from '@/userHelper/user-fields.util';
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
  OmitType,
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
    title: 'Filter by specific user UUIDs',
    description: 'Excludes all users except those with the specified IDs',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
    maxItems: 100,
    required: false,
  })
  @ToArray()
  @IsOptional()
  @IsUUID('4', { each: true, message: 'Each id must be a valid UUIDv4' })
  ids?: UUID[];

  @ApiPropertyOptional({
    title: 'Filter by first names',
    description:
      'Excludes all users except for those with the specified first names, supports partial matching across multiple first names',
    type: String,
    isArray: true,
    maxItems: 100,
    required: false,
  })
  @IsString({ each: true })
  @ToArray()
  @IsOptional()
  firstNames?: string[];

  @ApiPropertyOptional({
    title: 'Filter by last names',
    description:
      'Excludes all users except for those with the specified last names, supports partial matching across multiple last names',
    type: String,
    isArray: true,
    maxItems: 100,
    required: false,
  })
  @IsString({ each: true })
  @ToArray()
  @IsOptional()
  lastNames?: string[];

  @ApiPropertyOptional({
    title: 'Filter by countries',
    description:
      'Excludes all users except for those from the specified countries, supports multiple country codes',
    type: String,
    isArray: true,
    enum: COUNTRIES,
    uniqueItems: true,
    maxItems: 100,
    required: false,
  })
  @ToArray()
  @IsOptional()
  @IsEnum(COUNTRIES, { each: true })
  countries?: string[];

  @ApiPropertyOptional({
    title: 'Filter by email addresses',
    description:
      'Excludes all users except for those with the specified email addresses, supports multiple emails',
    type: String,
    isArray: true,
    format: 'email',
    uniqueItems: true,
    maxItems: 100,
  })
  @IsEmail({}, { each: true })
  @ToArray()
  @IsOptional()
  emails?: string[];

  @ApiPropertyOptional({
    description: 'Filter by phone numbers - supports multiple contact methods',
    type: String,
    isArray: true,
    format: 'phone',
    uniqueItems: true,
    maxItems: 100,
    required: false,
  })
  @IsString({ each: true })
  @ToArray()
  @IsOptional()
  phoneNumbers?: string[];

  @ApiPropertyOptional({
    title: 'Filter by account activation status',
    description:
      'Excludes users based on whether their account is active or not',
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive: boolean | undefined;

  @ApiPropertyOptional({
    title: 'Filter by account two factory enabled status',
    description:
      'False excludes users without two factor authentication enabled',
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isTwoFactorEnabled: boolean | undefined;

  @ApiPropertyOptional({
    title: 'Filter by email verification status',
    description:
      'Excludes users based on whether their email is verified or not',
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isEmailVerified: boolean | undefined;

  @ApiPropertyOptional({
    title: 'Filter by specific creator UUIDs',
    description:
      'Excludes all users except those created by the specified user IDs',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
    maxItems: 100,
    required: false,
  })
  @ToArray()
  @IsOptional()
  @IsUUID('4', {
    each: true,
    message: 'Each departmentId must be a valid UUIDv4',
  })
  createdByIds?: UUID[];

  @ApiPropertyOptional({
    title: 'Filter by specific department UUIDs',
    description: 'Excludes all users except those in the specified departments',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
    maxItems: 100,
    required: false,
  })
  @ToArray()
  @IsOptional()
  @IsUUID('4', {
    each: true,
    message: 'Each departmentId must be a valid UUIDv4',
  })
  departmentIds?: UUID[];

  @ApiPropertyOptional({
    title: 'Filter by specific department countries',
    description:
      'Excludes all users except those in departments from the specified countries',
    type: String,
    isArray: true,
    enum: COUNTRIES,
    uniqueItems: true,
    maxItems: 100,
    required: false,
  })
  @ToArray()
  @IsOptional()
  @IsEnum(COUNTRIES, { each: true })
  departmentCountries?: string[];

  @ApiPropertyOptional({
    title: 'Filter by specific role UUIDs',
    description: 'Excludes all users except those assigned the specified roles',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
    maxItems: 100,
    required: false,
  })
  @ToArray()
  @IsOptional()
  @IsUUID('4', { each: true, message: 'Each roleId must be a valid UUIDv4' })
  roleIds?: UUID[];

  @ApiPropertyOptional({
    title: 'Filter by specific role names',
    description:
      'Excludes all users except those assigned roles with the specified names',
    type: String,
    isArray: true,
    uniqueItems: true,
    maxItems: 100,
    required: false,
  })
  @ToArray()
  @IsOptional()
  @IsString({ each: true })
  roleNames?: string[];

  @ApiPropertyOptional({
    title: 'Filter by specific permission UUIDs',
    description:
      'Excludes all users except those roles with assigned the specified permissions',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
    maxItems: 100,
    required: false,
  })
  @ToArray()
  @IsOptional()
  @IsUUID('4', {
    each: true,
    message: 'Each permissionId must be a valid UUIDv4',
  })
  permissionIds?: UUID[];

  @ApiPropertyOptional({
    title: 'Filter by specific permission Codes',
    description:
      'Excludes all users except those roles with assigned the specified permissions',
    type: String,
    isArray: true,
    uniqueItems: true,
    maxItems: 100,
    required: false,
  })
  @ToArray()
  @IsOptional()
  @IsString({ each: true })
  permissionCodes?: string[];

  constructor(
    ids?: UUID[],
    firstNames?: string[],
    lastNames?: string[],
    countries?: COUNTRIES[],
    emails?: string[],
    phoneNumbers?: string[],
    isTwoFactorEnabled?: boolean,
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
    this.ids = ids ?? [];
    this.firstNames = firstNames ?? [];
    this.lastNames = lastNames ?? [];
    this.countries = countries ?? [];
    this.phoneNumbers = phoneNumbers ?? [];
    this.emails = emails ?? [];
    this.isTwoFactorEnabled = isTwoFactorEnabled ?? undefined;
    this.isActive = isActive ?? undefined;
    this.isEmailVerified = isEmailVerified ?? undefined;
    this.createdByIds = createdByIds ?? [];
    this.departmentIds = departmentIds ?? [];
    this.departmentCountries = departmentCountries ?? [];
    this.roleIds = roleIds ?? [];
    this.roleNames = roleNames ?? [];
    this.permissionIds = permissionIds ?? [];
    this.permissionCodes = permissionCodes ?? [];
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
      'Specific user fields to return - optimizes payload size and performance',
    enum: getCreatedByGenericSelectableFields(),
    type: String,
    isArray: true,
    required: false,
    example: getCreatedByGenericSelectableFields(['email']),
  })
  @ToArray()
  @IsEnum(getCreatedByGenericSelectableFields(), {
    each: true,
    message: 'Each selectUserField must be a valid user field',
  })
  @IsOptional()
  selectCreatedByFields: string[];

  @ApiPropertyOptional({
    description:
      'Specific user department fields to return - optimizes payload size and performance',
    enum: getUserDepartmentGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getUserDepartmentGenericSelectableFields({}),
  })
  @ToArray()
  @IsEnum(getUserDepartmentGenericSelectableFields({}), {
    each: true,
    message: 'Each selectUserDepartmentField must be a valid user role field',
  })
  @IsOptional()
  selectUserDepartmentFields: string[];

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
      'Specific role assigned by fields to return - optimizes payload size and performance',
    enum: getAssignedByGenericSelectableFields(),
    type: String,
    isArray: true,
    required: false,
    example: getAssignedByGenericSelectableFields(['email']),
  })
  @ToArray()
  @IsEnum(getAssignedByGenericSelectableFields(), {
    each: true,
    message: 'Each selectUserField must be a valid user field',
  })
  @IsOptional()
  selectAssignedByFields: string[];

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
    selectCreatedByFields,
    selectUserDepartmentFields,
    selectDepartmentFields,
    selectUserRoleFields,
    selectAssignedByFields,
    selectRoleFields,
    selectPermissionFields,
  }: {
    selectUserFields: string[] | undefined;
    selectCreatedByFields: string[] | undefined;
    selectUserDepartmentFields: string[] | undefined;
    selectDepartmentFields: string[] | undefined;
    selectUserRoleFields: string[] | undefined;
    selectAssignedByFields: string[] | undefined;
    selectRoleFields: string[] | undefined;
    selectPermissionFields: string[] | undefined;
  }) {
    super(selectUserFields);
    this.selectCreatedByFields = selectCreatedByFields ?? [];
    this.selectUserDepartmentFields = selectUserDepartmentFields ?? [];
    this.selectDepartmentFields = selectDepartmentFields ?? [];
    this.selectUserRoleFields = selectUserRoleFields ?? [];
    this.selectAssignedByFields = selectAssignedByFields ?? [];
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
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  includeCreatedBy: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include Department in the response',
    default: false,
    required: false,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  includeDepartments: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include Roles in the response',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  includeRoles: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Include Permissions in the response',
    default: false,
    required: false,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  includePermissions: boolean;

  constructor(
    includeCreatedBy: boolean | undefined,
    includeDepartments: boolean | undefined,
    includeRoles: boolean | undefined,
    includePermissions: boolean | undefined,
    selectUserFields: string[] | undefined,
    selectCreatedByFields: string[] | undefined,
    selectUserDepartmentFields: string[] | undefined,
    selectDepartmentFields: string[] | undefined,
    selectUserRoleFields: string[] | undefined,
    selectAssignedByFields: string[] | undefined,
    selectRoleFields: string[] | undefined,
    selectPermissionFields: string[] | undefined,
  ) {
    super({
      selectUserFields,
      selectCreatedByFields,
      selectUserDepartmentFields,
      selectDepartmentFields,
      selectUserRoleFields,
      selectAssignedByFields,
      selectRoleFields,
      selectPermissionFields,
    });
    this.includeCreatedBy = includeCreatedBy ?? false;
    this.includeDepartments = includeDepartments ?? false;
    this.includeRoles = includeRoles ?? false;
    this.includePermissions = includePermissions ?? false;
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

export class UserDateRequestDto extends OmitType(QueryDateRequestDto, [
  'dateFilterParam',
]) {
  @ApiPropertyOptional({
    description: 'Additional date filter parameter for custom filtering logic',
    example: 'createdAt',
    enum: UserDateParams,
    type: String,
  })
  @IsEnum(UserDateParams, {
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
    maxItems: 100,
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

export class FilterUsersQueryDto extends IntersectionType(
  UserQueryParametersDto,
  UserDateRequestDto,
  UserQueryResponseControlDto,
  PaginationDto,
  UserSortDto,
) {}
