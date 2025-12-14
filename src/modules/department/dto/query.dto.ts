import { PaginationDto, QueryDateRequestDto } from '@/baseDto/pagination.dto';
import { ToArray } from '@/commonDecorators/array.decorator';
import { ToBoolean } from '@/commonDecorators/boolean.decorator';
import { getDepartmentGenericSelectableFields } from '@/departmentHelper/department-fields.util';
import { COUNTRIES } from '@/libConst/countries.const';
import {
  getCreatedByGenericSelectableFields,
  getUserGenericSelectableFields,
} from '@/userHelper/user-fields.util';
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';

import {
  IsArray,
  IsBoolean,
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
export class DepartmentQueryParametersDto {
  @ApiPropertyOptional({
    description: 'Filter by specific deparment UUIDs for bulk operations',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
  })
  @ToArray()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each id must be a valid UUIDv4' })
  ids: UUID[] | undefined;

  @ApiPropertyOptional({
    description: 'Filter by specific deparment UUIDs for bulk operations',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
  })
  @ToArray()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each id must be a valid UUIDv4' })
  userIds: UUID[] | undefined;

  @ApiPropertyOptional({
    description: 'Filter by specific deparment UUIDs for bulk operations',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
  })
  @ToArray()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each id must be a valid UUIDv4' })
  createdByUserIds: UUID[] | undefined;

  @ApiPropertyOptional({
    description:
      'Filter by department names - supports partial matching across multiple names',
    type: String,
    isArray: true,
    maxItems: 100,
  })
  @IsString({ each: true })
  @ToArray()
  @IsOptional()
  names: string[] | undefined;

  @ApiPropertyOptional({
    description: 'Filter by countries - supports multiple countries',
    type: String,
    isArray: true,
    enum: COUNTRIES,
    uniqueItems: true,
  })
  @ToArray()
  @IsOptional()
  @IsEnum(COUNTRIES, { each: true })
  countries: COUNTRIES[] | undefined;

  constructor(
    ids?: UUID[],
    names?: string[],
    countries?: COUNTRIES[],
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

export class DepartmentSelectDto {
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

  constructor(selectDepartmentFields: string[] | undefined) {
    this.selectDepartmentFields = selectDepartmentFields ?? [];
  }
}

export class DepartmentRelationSelectDto extends DepartmentSelectDto {
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
      'Specific user fields to return - optimizes payload size and performance',
    enum: getUserGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getUserGenericSelectableFields({ fields: ['email'] }),
  })
  @ToArray()
  @IsEnum(getUserGenericSelectableFields({}), {
    each: true,
    message: 'Each selectUserField must be a valid user field',
  })
  @IsOptional()
  selectUserFields: string[];

  constructor({
    selectCreatedByFields,
    selectDepartmentFields,
    selectUserFields,
  }: {
    selectCreatedByFields: string[] | undefined;
    selectDepartmentFields: string[] | undefined;
    selectUserFields: string[] | undefined;
  }) {
    super(selectDepartmentFields);
    this.selectCreatedByFields = selectCreatedByFields ?? [];
    this.selectUserFields = selectUserFields ?? [];
  }
}

export class DepartmentQueryResponseControlDto extends DepartmentRelationSelectDto {
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
    description: 'Include Department users in the response',
    default: false,
    required: false,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  includeUsers: boolean;

  constructor(
    includeCreatedBy: boolean | undefined,
    includeUsers: boolean | undefined,
    selectCreatedByFields: string[] | undefined,
    selectDepartmentFields: string[] | undefined,
    selectUserFields: string[] | undefined,
  ) {
    super({
      selectCreatedByFields,
      selectDepartmentFields,
      selectUserFields,
    });
    this.includeCreatedBy = includeCreatedBy ?? false;
    this.includeUsers = includeUsers ?? false;
  }
}

export class DepartmentSortDto {
  @ApiPropertyOptional({
    description: 'Entity field name to sort results by',
    enum: getDepartmentGenericSelectableFields({}),
    type: String,
    required: false,
  })
  @IsEnum(getDepartmentGenericSelectableFields({}), {
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

export class DepartmentRequestDto extends IntersectionType(
  PaginationDto,
  DepartmentSortDto,
  DepartmentQueryResponseControlDto,
) {}

export class GetDepartmentsByIdsRequestDto extends DepartmentRequestDto {
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

export class DepartmentSearchRequestDto extends IntersectionType(
  PaginationDto,
  DepartmentSortDto,
  DepartmentSelectDto,
) {}

export class FilterDepartmentsQueryDto extends IntersectionType(
  DepartmentQueryParametersDto,
  QueryDateRequestDto,
  DepartmentQueryResponseControlDto,
  PaginationDto,
  DepartmentSortDto,
) {}
