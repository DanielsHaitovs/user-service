import {
  EXAMPLE_PERMISSION_CODE,
  EXAMPLE_PERMISSION_ID,
  EXAMPLE_PERMISSION_NAME,
} from '@/lib/const/role.const';
import { RoleResponseDto } from '@/role/dto/role.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { UUID } from 'crypto';

import { PaginatedResponseDto } from '../../base/dto/pagination.dto';

export class PermissionBaseDto {
  @ApiProperty({
    example: EXAMPLE_PERMISSION_NAME,
    description: 'Name of the permission',
    minLength: 1,
    maxLength: 100,
    required: true,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: EXAMPLE_PERMISSION_CODE,
    description: 'Unique code for the permission',
    minLength: 1,
    maxLength: 100,
    required: true,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  constructor(name: string, code: string) {
    this.name = name;
    this.code = code;
  }
}

export class CreatePermissionDto extends PermissionBaseDto {
  @ApiProperty({
    type: String,
    isArray: false,
    format: 'uuid',
    description:
      'Unique identifier of the role to which this permission belongs',
    example: EXAMPLE_PERMISSION_ID,
    required: true,
  })
  @IsUUID('all', { each: true })
  @IsNotEmpty()
  roleId: UUID;

  constructor(name: string, code: string, roleId: UUID) {
    super(name, code);
    this.roleId = roleId;
  }
}

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}

export class PermissionResponseDto extends PermissionBaseDto {
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
    type: RoleResponseDto,
    isArray: false,
    description: 'Roles associated with this permission',
  })
  @Type(() => RoleResponseDto)
  @ValidateNested({ each: true })
  role: RoleResponseDto;

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
    role: RoleResponseDto,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(name, code);
    this.id = id;
    this.role = role;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
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
