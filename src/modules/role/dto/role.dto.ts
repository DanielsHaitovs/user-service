import { PaginatedResponseDto } from '@/base/dto/pagination.dto';
import {
  EXAMPLE_PERMISSION_ID,
  EXAMPLE_ROLE_ID,
  EXAMPLE_ROLE_NAME,
} from '@/lib/const/role.const';
import { PermissionResponseDto } from '@/role/dto/permission.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UUID } from 'crypto';

export class RoleBaseDto {
  @ApiProperty({
    example: EXAMPLE_ROLE_NAME,
    description: 'Name of the role',
    required: true,
    type: String,
  })
  @MinLength(5)
  @IsString()
  @IsNotEmpty()
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

export class CreateRoleDto extends RoleBaseDto {
  @ApiProperty({
    type: String,
    isArray: true,
    description: 'List of permissions associated with this role',
    example: ['manage_users', 'create_order'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  constructor(name: string, permissions?: string[]) {
    super(name);
    this.permissions = permissions ?? [];
  }
}

export class UpdateRoleDto extends PartialType(RoleBaseDto) {}

export class RoleResponseDto extends RoleBaseDto {
  @ApiProperty({
    example: [EXAMPLE_ROLE_ID],
    description: 'Unique identifier of the role',
    type: String,
    format: 'uuid',
    readOnly: true,
  })
  @IsUUID()
  id: UUID;

  @ApiProperty({
    description: 'Creation timestamp of the role',
    example: '2023-10-01T12:00:00Z',
    readOnly: true,
    type: Date,
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp of the role',
    example: '2023-10-01T12:00:00Z',
    readOnly: true,
    type: Date,
  })
  @IsDate()
  updatedAt: Date;

  @ApiProperty({
    type: PermissionResponseDto,
    isArray: true,
    description: 'List of permissions associated with this role',
    example: [EXAMPLE_PERMISSION_ID],
  })
  @Type(() => PermissionResponseDto)
  @ValidateNested({ each: true })
  @IsOptional()
  permissions?: PermissionResponseDto[];

  constructor(
    id: UUID,
    name: string,
    createdAt: Date,
    updatedAt: Date,
    permissions?: PermissionResponseDto[],
  ) {
    super(name);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.permissions = permissions ?? [];
  }
}

export class RoleListResponseDto extends PaginatedResponseDto {
  @ApiProperty({
    type: RoleResponseDto,
    isArray: true,
    description: 'List of roles',
  })
  @Type(() => RoleResponseDto)
  @ValidateNested({ each: true })
  roles: RoleResponseDto[];

  constructor(
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    roles: RoleResponseDto[],
  ) {
    super(total, page, limit, totalPages);
    this.roles = roles;
  }
}
