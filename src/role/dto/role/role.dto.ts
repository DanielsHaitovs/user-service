import { PaginatedResponseDto } from '@/baseDto/pagination.dto';
import { EXAMPLE_PERMISSION_ID } from '@/libConst/permission.const';
import { EXAMPLE_ROLE_ID, EXAMPLE_ROLE_NAME } from '@/libConst/role.const';
import { PermissionResponseDto } from '@/rolePermissionDto/permission.dto';
import { GetCreatedByDto } from '@/userDto/user.dto';
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

/**
 * Base DTO for Role entity, containing common properties for role creation and retrieval.
 * This class is extended by CreateRoleDto and GetRoleResponseDto to ensure consistency in role data structure.
 * The RoleBaseDto includes validation rules for the role name, ensuring it is a non-empty string with a minimum length of 5 characters.
 */
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

/**
 * DTO for creating a new role, extending the RoleBaseDto and adding an optional list of permissions.
 * The CreateRoleDto allows clients to specify permissions by either their unique IDs or their string codes when creating a role.
 * This flexibility enables easier integration with different client applications that may reference permissions in various ways.
 */
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

/**
 * DTO for updating an existing role, extending the RoleBaseDto and making all properties optional.
 * The UpdateRoleDto allows clients to update any subset of the role's properties, providing flexibility in how roles are modified.
 * This design enables partial updates to roles without requiring clients to resend unchanged data, improving efficiency and ease of use.
 */
export class UpdateRoleDto extends PartialType(RoleBaseDto) {}

/**
 * DTO for assigning permissions to a role, containing the role ID and lists of permission IDs and codes.
 * The AssignPermissionsToRoleDto allows clients to associate permissions with a role by specifying either the permission IDs or their string codes.
 * This design provides flexibility in how permissions are referenced when assigning them to roles, accommodating different client needs and data structures.
 */
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

/**
 * DTO for retrieving role information, extending the RoleBaseDto and adding properties for role ID, creation and update timestamps.
 * The GetRoleDto provides a comprehensive view of a role's details, including its unique identifier, name, timestamps, associated permissions, and creator information.
 * This DTO is designed to be used in responses when fetching role data, ensuring that clients receive all relevant information about a role in a consistent format.
 */
export class GetRoleDto extends RoleBaseDto {
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

/**
 * DTO for role response, extending GetRoleDto and adding properties for associated permissions and creator information.
 * The RoleResponseDto provides a detailed representation of a role, including its unique identifier, name, timestamps, associated permissions, and information about the user who created the role.
 * This DTO is intended for use in API responses when fetching role data, ensuring that clients receive comprehensive information about a role in a structured format.
 */
export class RoleResponseDto extends GetRoleDto {
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
    description: 'Information about the user who created the role',
    type: () => GetCreatedByDto,
    isArray: false,
  })
  @Type(() => GetCreatedByDto)
  @ValidateNested()
  createdBy: GetCreatedByDto;

  constructor(
    id: UUID,
    name: string,
    createdAt: Date,
    updatedAt: Date,
    createdBy: GetCreatedByDto,
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

/**
 * DTO for paginated response of roles, extending the PaginatedResponseDto and adding a list of RoleResponseDto.
 * The RoleListResponseDto provides a structured format for returning a paginated list of roles, including pagination metadata and the list of roles themselves.
 * This DTO is designed to be used in API responses when fetching multiple roles, ensuring that clients receive both the pagination information and the role data in a consistent format.
 */
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
