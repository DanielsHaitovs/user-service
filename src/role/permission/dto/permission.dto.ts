import { PaginatedResponseDto } from '@/baseDto/pagination.dto';
import {
  EXAMPLE_PERMISSION_CODE,
  EXAMPLE_PERMISSION_ID,
  EXAMPLE_PERMISSION_NAME,
} from '@/libConst/permission.const';
import { EXAMPLE_ROLE_ID } from '@/libConst/role.const';
import { GetRelatedRoleDto } from '@/roleDto/role.dto';
import { GetCreatedByDto } from '@/userDto/user.dto';
import { ApiProperty, PickType } from '@nestjs/swagger';

import { Trim } from 'class-sanitizer';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UUID } from 'crypto';

export class PermissionBaseDto {
  @ApiProperty({
    example: EXAMPLE_PERMISSION_NAME,
    description: 'Name of the permission',
    minLength: 1,
    maxLength: 100,
    required: true,
    type: String,
  })
  @MinLength(1)
  @IsString()
  @IsNotEmpty()
  @Trim()
  name: string;

  @ApiProperty({
    example: EXAMPLE_PERMISSION_CODE,
    description: 'Unique code for the permission',
    minLength: 1,
    maxLength: 100,
    required: true,
    type: String,
  })
  @MinLength(1)
  @IsString()
  @IsNotEmpty()
  @Trim()
  code: string;

  constructor(name: string, code: string) {
    this.name = name;
    this.code = code;
  }
}

export class CreatePermissionDto extends PermissionBaseDto {
  @ApiProperty({
    type: String,
    isArray: true,
    format: 'uuid',
    description:
      'Unique identifiers of the role to which this permission belongs',
    example: [EXAMPLE_ROLE_ID],
    required: true,
  })
  @IsUUID('all', { each: true })
  @IsOptional()
  @Trim('', { each: true })
  roleIds: UUID[];

  constructor(name: string, code: string, roleIds: UUID[]) {
    super(name, code);
    this.roleIds = roleIds;
  }
}

export class UpdatePermissionDto extends PickType(PermissionBaseDto, [
  'name',
]) {}

export class GetPermissionDto extends PermissionBaseDto {
  @ApiProperty({
    example: EXAMPLE_PERMISSION_ID,
    description: 'Unique identifier of the permission',
    type: String,
    format: 'uuid',
    readOnly: true,
  })
  @IsUUID()
  id: UUID;

  @ApiProperty({
    description: 'Creation timestamp of the permission',
    example: '2023-10-01T12:00:00Z',
    readOnly: true,
    type: Date,
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp of the permission',
    example: '2023-10-01T12:00:00Z',
    readOnly: true,
    type: Date,
  })
  @IsDate()
  updatedAt: Date;

  constructor(
    id: UUID,
    name: string,
    code: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(name, code);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class RelatedPermissionDto extends GetPermissionDto {}

export class PermissionResponseDto extends GetPermissionDto {
  @ApiProperty({
    type: GetRelatedRoleDto,
    isArray: true,
    description: 'Roles associated with this permission',
  })
  @Type(() => GetRelatedRoleDto)
  @ValidateNested({ each: true })
  roles: GetRelatedRoleDto[];

  @ApiProperty({
    description: 'Information about the user who created the permission',
    type: () => GetCreatedByDto,
    isArray: false,
  })
  @Type(() => GetCreatedByDto)
  @ValidateNested()
  createdBy: GetCreatedByDto;

  constructor(
    id: UUID,
    name: string,
    code: string,
    roles: GetRelatedRoleDto[],
    createdBy: GetCreatedByDto,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, name, code, createdAt, updatedAt);
    this.roles = roles;
    this.createdBy = createdBy;
  }
}

export class PermissionListResponseDto extends PaginatedResponseDto {
  @ApiProperty({
    type: PermissionResponseDto,
    isArray: true,
    description: 'List of permissions',
  })
  @Type(() => PermissionResponseDto)
  @ValidateNested({ each: true })
  permissions: PermissionResponseDto[];

  constructor(
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    permissions: PermissionResponseDto[],
  ) {
    super(total, page, limit, totalPages);
    this.permissions = permissions;
  }
}
