import { ToArray } from '@/commonDecorators/array.decorator';
import { EXAMPLE_STORE_ID } from '@/lib/const/store.const';
import { GetRelatedStoreDto } from '@/storeDto/store.dto';
import { GetAssignedByDto, GetRelatedUserDto } from '@/userDto/user.dto';
import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { UUID } from 'crypto';

export class CreateUserStoresDto {
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
    title: 'User Store IDs',
    description:
      'Store IDs to assign to the user - must be valid UUIDs of existing stores',
    example: [EXAMPLE_STORE_ID],
    required: true,
  })
  @ToArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  storeIds: UUID[];

  constructor(userId: string, storeIds: UUID[]) {
    this.userId = userId;
    this.storeIds = storeIds;
  }
}

export class GetUserStoreDto {
  @ApiProperty({
    description: 'User store assignment',
    type: () => GetRelatedStoreDto,
    isArray: false,
  })
  @Type(() => GetRelatedStoreDto)
  @ValidateNested()
  store?: GetRelatedStoreDto;

  @ApiProperty({
    description: 'User that assigned the stores',
    type: () => GetAssignedByDto,
    isArray: false,
  })
  @Type(() => GetAssignedByDto)
  @ValidateNested()
  assignedBy?: GetAssignedByDto;
}

export class UserStoresResponseDto {
  @ApiProperty({
    description: 'User to which the stores are assigned',
    type: GetRelatedUserDto,
    isArray: false,
  })
  @Type(() => GetRelatedUserDto)
  @ValidateNested()
  user?: GetRelatedUserDto;

  @ApiProperty({
    description: 'List of stores assigned to the user',
    type: GetUserStoreDto,
    isArray: true,
  })
  @Type(() => GetUserStoreDto)
  @ValidateNested({ each: true })
  stores: GetUserStoreDto[];

  constructor(user: GetRelatedUserDto, stores: GetUserStoreDto[]) {
    this.user = user;
    this.stores = stores;
  }
}

export class AssignStoresToUserDto {
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
    title: 'User Store IDs',
    description:
      'Store IDs to assign to the user - must be valid UUIDs of existing stores',
    example: [EXAMPLE_STORE_ID],
    required: true,
  })
  @ToArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  storeIds: UUID[];

  constructor(userId: UUID, storeIds: UUID[]) {
    this.userId = userId;
    this.storeIds = storeIds;
  }
}

export class UnassignStoresFromUserDto extends AssignStoresToUserDto {}
