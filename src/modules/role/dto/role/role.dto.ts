import { PaginatedResponseDto } from '@/baseDto/pagination.dto';
import { EXAMPLE_PERMISSION_ID } from '@/libConst/permission.const';
import { EXAMPLE_ROLE_ID, EXAMPLE_ROLE_NAME } from '@/libConst/role.const';
import { PermissionResponseDto } from '@/rolePermissionDto/permission.dto';
import { GetUserDto } from '@/userDto/user.dto';
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

export class AssignPermissionsToRoleDto {
  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Permission codes to associate with this role',
    example: ['manage_users', 'create_order'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionCodes: string[];

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Permission IDs to associate with this role',
    example: [EXAMPLE_PERMISSION_ID],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  @IsOptional()
  permissionIds: UUID[];

  @ApiProperty({
    example: [EXAMPLE_ROLE_ID],
    description: 'Unique identifier of the role',
    type: String,
    format: 'uuid',
    readOnly: true,
  })
  @IsUUID()
  roleId: UUID;

  constructor(roleId: UUID, permissionIds: UUID[], permissionCodes: string[]) {
    this.roleId = roleId;
    this.permissionIds = permissionIds;
    this.permissionCodes = permissionCodes;
  }
}

export class GetRoleResponseDto extends RoleBaseDto {
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

  constructor(id: UUID, name: string, createdAt: Date, updatedAt: Date) {
    super(name);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class RoleResponseDto extends GetRoleResponseDto {
  @ApiProperty({
    type: PermissionResponseDto,
    isArray: true,
    description: 'List of permissions associated with this role',
    example: [EXAMPLE_PERMISSION_ID],
  })
  @Type(() => PermissionResponseDto)
  @ValidateNested({ each: true })
  @IsOptional()
  permissions: PermissionResponseDto[];

  @ApiProperty({
    description: 'List of roles assigned to the user',
    type: () => GetUserDto,
    isArray: false,
  })
  @Type(() => GetUserDto)
  @ValidateNested()
  createdBy: GetUserDto;

  constructor(
    id: UUID,
    name: string,
    createdAt: Date,
    updatedAt: Date,
    createdBy: GetUserDto,
    permissions?: PermissionResponseDto[],
  ) {
    super(id, name, createdAt, updatedAt);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.permissions = permissions ?? [];
    this.createdBy = createdBy;
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
