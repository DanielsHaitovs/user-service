import {
  PaginatedResponseDto,
  QueryRequestDto,
} from '@/baseDto/pagination.dto';
import { EXAMPLE_ROLE_ID } from '@/commonConst/role.const';
import { EXAMPLE_USER_ID } from '@/commonConst/user.const';
import { ToArray } from '@/commonDecorators/array.decorator';
import { GetRelatedRoleDto } from '@/roleDto/role.dto';
import { GetAssignedByDto } from '@/userDto/user.dto';
import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { UUID } from 'crypto';

export class CreateUserRolesDto {
  @ApiProperty({
    description: 'User unique identifier - must be a valid UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    isArray: true,
    title: 'User Role IDs',
    description:
      'Role IDs to assign to the user - must be valid UUIDs of existing roles',
    example: [EXAMPLE_ROLE_ID],
    required: true,
  })
  @ToArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  roleIds: UUID[];

  constructor(userId: string, roleIds: UUID[]) {
    this.userId = userId;
    this.roleIds = roleIds;
  }
}

export class GetUserRoleDto {
  @ApiProperty({
    description: 'User role assignment',
    type: () => GetRelatedRoleDto,
    isArray: false,
  })
  @Type(() => GetRelatedRoleDto)
  @ValidateNested()
  role?: GetRelatedRoleDto;

  @ApiProperty({
    description: 'User that assigned the roles',
    type: () => GetAssignedByDto,
    isArray: false,
  })
  @Type(() => GetAssignedByDto)
  @ValidateNested()
  assignedBy?: GetAssignedByDto;
}

export class AssignRolesToUserDto {
  @ApiProperty({
    title: 'User ID',
    description: 'User unique identifier - must be a valid UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  userId: UUID;

  @ApiProperty({
    type: String,
    format: 'uuid',
    isArray: true,
    title: 'User Role IDs',
    description:
      'Role IDs to assign to the user - must be valid UUIDs of existing roles',
    example: [EXAMPLE_ROLE_ID],
    required: true,
  })
  @ToArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  @ArrayNotEmpty({ message: 'roleIds cannot be an empty array if provided' })
  roleIds: UUID[];

  constructor(userId: UUID, roleIds: UUID[]) {
    this.userId = userId;
    this.roleIds = roleIds;
  }
}

export class UnassignRolesFromUserDto extends AssignRolesToUserDto {}

export class UserRolesQueryRequest extends QueryRequestDto {
  @ApiProperty({
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  userId: UUID;

  constructor(
    userId: UUID,
    page: number,
    limit: number,
    sortField?: string,
    sortOrder?: 'ASC' | 'DESC',
    dateFrom?: Date,
    dateTo?: Date,
    dateFilterParam?: string,
  ) {
    super(sortField, sortOrder, page, limit, dateFrom, dateTo, dateFilterParam);
    this.userId = userId;
  }
}

export class UserRolesListResponseDto extends PaginatedResponseDto {
  @ApiProperty({
    description: 'List of user roles matching the provided user ID',
    type: GetUserRoleDto,
    isArray: true,
  })
  @Type(() => GetUserRoleDto)
  @ValidateNested({ each: true })
  data: GetUserRoleDto[];

  constructor(
    data: GetUserRoleDto[],
    total: number,
    page: number,
    limit: number,
    totalPages: number,
  ) {
    super(total, page, limit, totalPages);
    this.data = data;
  }
}
