import { ToArray } from '@/commonDecorators/array.decorator';
import {
  EXAMPLE_STORE_CODE,
  EXAMPLE_STORE_ID,
  EXAMPLE_STORE_VIEW_CODE,
} from '@/lib/const/store.const';
import { GetRelatedStoreDto } from '@/storeDto/store.dto';
import { GetAssignedByDto } from '@/userDto/user.dto';
import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { UUID } from 'crypto';

import {
  PaginatedResponseDto,
  QueryRequestDto,
} from '../../base/dto/pagination.dto';
import { EXAMPLE_USER_ID } from '../../lib/const/user.const';

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

export class UserStoresQueryRequest extends QueryRequestDto {
  @ApiProperty({
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  userId: UUID;

  @ApiProperty({
    type: String,
    isArray: true,
    title: 'Store Codes',
    description:
      'Store codes to filter the user stores - must be valid codes of existing stores',
    example: [EXAMPLE_STORE_CODE],
    required: false,
  })
  @ToArray()
  @IsString({ each: true })
  @IsOptional()
  codes: string[];

  @ApiProperty({
    type: String,
    isArray: true,
    title: 'Store View Codes',
    description:
      'Store view codes to filter the user stores - must be valid view codes of existing stores',
    example: [EXAMPLE_STORE_VIEW_CODE],
    required: false,
  })
  @ToArray()
  @IsString({ each: true })
  @IsOptional()
  viewCodes: string[];

  constructor(
    userId: UUID,
    page: number,
    limit: number,
    codes?: string[],
    viewCodes?: string[],
    sortField?: string,
    sortOrder?: 'ASC' | 'DESC',
    dateFrom?: Date,
    dateTo?: Date,
    dateFilterParam?: string,
  ) {
    super(sortField, sortOrder, page, limit, dateFrom, dateTo, dateFilterParam);
    this.userId = userId;
    this.codes = codes ?? [];
    this.viewCodes = viewCodes ?? [];
  }
}

export class UserStoresListResponseDto extends PaginatedResponseDto {
  @ApiProperty({
    description: 'List of user stores matching the provided user ID',
    type: GetUserStoreDto,
    isArray: true,
  })
  @Type(() => GetUserStoreDto)
  @ValidateNested({ each: true })
  data: GetUserStoreDto[];

  constructor(
    data: GetUserStoreDto[],
    total: number,
    page: number,
    limit: number,
    totalPages: number,
  ) {
    super(total, page, limit, totalPages);
    this.data = data;
  }
}
