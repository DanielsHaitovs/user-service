import { PaginationDto } from '@/baseDto/pagination.dto';
import { ToArray } from '@/commonDecorators/array.decorator';
import { UserQueryResponseControlDto } from '@/userQueryDto/user.dto';
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
  OmitType,
} from '@nestjs/swagger';

import { IsOptional, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class UserDepartmentResponseControlDto extends OmitType(
  UserQueryResponseControlDto,
  [
    'includeCreatedBy',
    'includeDepartments',
    'includePermissions',
    'includeRoles',
    'selectAssignedByFields',
    'selectCreatedByFields',
    'selectRoleFields',
    'selectPermissionFields',
    'selectUserDepartmentFields',
    'selectDepartmentFields',
    'selectUserRoleFields',
    'selectUserFields',
  ] as const,
) {}

export class UserDepartmentRequestDto extends IntersectionType(
  PaginationDto,
  UserDepartmentResponseControlDto,
) {}

export class GetUserDepartmentByIdsRequestDto extends UserDepartmentRequestDto {
  @ApiProperty({
    description: 'Filter by specific user department UUIDs for bulk operations',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
    nullable: false,
    required: false,
  })
  @ToArray()
  @IsUUID('4', { each: true, message: 'Each id must be a valid UUIDv4' })
  ids?: UUID[];

  @ApiProperty({
    description: 'Filter by specific user department UUIDs for bulk operations',
    type: String,
    isArray: true,
    format: 'uuid',
    uniqueItems: true,
    required: false,
  })
  @ToArray()
  @IsUUID('4', { each: true, message: 'Each id must be a valid UUIDv4' })
  departmentIds?: UUID[];

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    title: 'User ID Filter',
    description: 'Filter to include only departments assigned to users',
    required: false,
  })
  @IsOptional()
  @IsUUID(4)
  userId: UUID | undefined;

  constructor(
    ids: UUID[] | undefined,
    departmentIds: UUID[] | undefined,
    userId: UUID | undefined,
  ) {
    super();
    this.ids = ids ?? [];
    this.departmentIds = departmentIds ?? [];
    this.userId = userId;
  }
}
