import { PaginationDto } from '@/baseDto/pagination.dto';
import { ToArray } from '@/commonDecorators/array.decorator';
import { UserQueryResponseControlDto } from '@/userQueryDto/user.dto';
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
  OmitType,
} from '@nestjs/swagger';

import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class UserRoleResponseControlDto extends OmitType(
  UserQueryResponseControlDto,
  [
    'includeCreatedBy',
    'includeDepartments',
    'includePermissions',
    'includeRoles',
    'selectAssignedByFields',
    'selectUserDepartmentFields',
    'selectDepartmentFields',
    'selectCreatedByFields',
    'selectRoleFields',
    'selectUserRoleFields',
    'selectPermissionFields',
  ] as const,
) {}

export class UserRoleRequestDto extends IntersectionType(
  PaginationDto,
  UserRoleResponseControlDto,
) {}

export class GetUserRolesByIdsRequestDto extends UserRoleRequestDto {
  @ApiProperty({
    description: 'Filter by specific user role UUIDs for bulk operations',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
    nullable: false,
  })
  @ToArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true, message: 'Each id must be a valid UUIDv4' })
  ids?: UUID[];

  @ApiProperty({
    description: 'Filter by specific user role UUIDs for bulk operations',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
    nullable: false,
  })
  @ToArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true, message: 'Each id must be a valid UUIDv4' })
  roleIds?: UUID[];

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    title: 'User ID Filter',
    description: 'Filter to include only roles assigned to users',
    required: false,
  })
  @IsOptional()
  @IsUUID(4)
  userId: UUID | undefined;

  constructor(
    ids: UUID[] | undefined,
    roleIds: UUID[] | undefined,
    userId: UUID | undefined,
  ) {
    super();
    this.ids = ids ?? [];
    this.roleIds = roleIds ?? [];
    this.userId = userId;
  }
}
