import { PaginationDto, QueryDateRequestDto } from '@/baseDto/pagination.dto';
import { ToArray } from '@/commonDecorators/array.decorator';
import { ToBoolean } from '@/commonDecorators/boolean.decorator';
import { EXAMPLE_ROLE_ID } from '@/roleConst/role.const';
import { getRoleGenericSelectableFields } from '@/roleHelper/role-fields.util';
import {
  PermissionQueryParametersDto,
  PermissionRelationSelectDto,
} from '@/rolePermissionDto/permission.query';
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

export class RoleSortDto {
  @ApiPropertyOptional({
    description: 'Entity field name to sort results by',
    enum: getRoleGenericSelectableFields({}),
    type: String,
    required: false,
  })
  @IsEnum(getRoleGenericSelectableFields({}), {
    each: true,
    message: 'sortField must be a valid role field',
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

export class RoleSelectDto {
  @ApiProperty({
    description:
      'Specific role fields to return - optimizes payload size and performance',
    enum: getRoleGenericSelectableFields({}),
    type: String,
    isArray: true,
    required: false,
    example: getRoleGenericSelectableFields({}),
  })
  @IsOptional()
  @ToArray()
  @IsEnum(getRoleGenericSelectableFields({}), { each: true })
  selectRoleFields: string[];

  constructor(selectRoleFields: string[] | undefined) {
    this.selectRoleFields = selectRoleFields ?? [];
  }
}

export class RoleRelationSelectDto extends PermissionRelationSelectDto {}

export class RoleQueryResponseControlDto extends RoleRelationSelectDto {
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
    description: 'Include Permissions in the response',
    default: false,
    required: false,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  includePermissions: boolean;

  constructor(
    selectRoleFields: string[] | undefined,
    selectPermissionFields: string[] | undefined,
    selectCreatedByFields: string[] | undefined,
    includeCreatedBy: boolean | undefined,
    includePermissions: boolean | undefined,
  ) {
    super(selectRoleFields, selectPermissionFields, selectCreatedByFields);
    this.includeCreatedBy = includeCreatedBy ?? false;
    this.includePermissions = includePermissions ?? false;
  }
}

export class FilterRolesQueryDto extends IntersectionType(
  RoleSortDto,
  PaginationDto,
  RoleQueryResponseControlDto,
  QueryDateRequestDto,
  RoleQueryParametersDto,
  PermissionQueryParametersDto,
) {}

export class RoleRequestDto extends IntersectionType(
  RoleSortDto,
  PaginationDto,
  RoleQueryResponseControlDto,
) {}

export class GetRoleByIdsQueryDto extends RoleRequestDto {
  @ApiProperty({
    description: 'Filter by specific role UUIDs for bulk operations',
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

export class RoleSearchRequestDto extends IntersectionType(
  PaginationDto,
  RoleSortDto,
  RoleSelectDto,
) {}
