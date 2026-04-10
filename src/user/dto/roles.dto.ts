import { ToArray } from '@/commonDecorators/array.decorator';
import { EXAMPLE_ROLE_ID } from '@/lib/const/role.const';
import { GetRelatedRoleDto } from '@/roleDto/role.dto';
import { GetAssignedByDto, GetRelatedUserDto } from '@/userDto/user.dto';
import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
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

export class UserRolesResponseDto {
  @ApiProperty({
    description: 'User to which the roles are assigned',
    type: GetRelatedUserDto,
    isArray: false,
  })
  @Type(() => GetRelatedUserDto)
  @ValidateNested()
  user?: GetRelatedUserDto;

  @ApiProperty({
    description: 'List of roles assigned to the user',
    type: GetUserRoleDto,
    isArray: true,
  })
  @Type(() => GetUserRoleDto)
  @ValidateNested({ each: true })
  roles: GetUserRoleDto[];

  constructor(user: GetRelatedUserDto, roles: GetUserRoleDto[]) {
    this.user = user;
    this.roles = roles;
  }
}
