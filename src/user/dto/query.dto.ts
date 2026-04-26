import { QueryRequestDto } from '@/baseDto/pagination.dto';
import { ToArray } from '@/commonDecorators/array.decorator';
import { ToBoolean } from '@/commonDecorators/boolean.decorator';
import { EXAMPLE_STORE_ID } from '@/lib/const/store.const';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsOptional, IsString, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class UserQueryRequest extends QueryRequestDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    isArray: true,
    title: 'User IDs',
    description: 'User IDs - must be valid UUIDs of existing users',
    example: [EXAMPLE_STORE_ID],
    required: true,
  })
  @ToArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  ids?: UUID[];

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    title: 'User Names',
    description: 'User Names - must be valid strings of existing users',
    example: ['User1', 'User2'],
    required: true,
  })
  @ToArray()
  @IsString({ each: true })
  @IsOptional()
  firstNames?: string[];

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    title: 'User Emails',
    description: 'User Emails - must be valid strings of existing users',
    example: ['user1@example.com', 'user2@example.com'],
    required: true,
  })
  @ToArray()
  @IsString({ each: true })
  @IsOptional()
  emails?: string[];

  @ApiPropertyOptional({
    type: Boolean,
    isArray: false,
    title: 'User Active Status',
    description: 'User Active Status - must be a valid boolean value',
    example: true,
    required: true,
  })
  @ToBoolean()
  @IsOptional()
  isActive?: boolean | undefined;

  constructor(
    page: number,
    limit: number,
    ids?: UUID[],
    firstNames?: string[],
    emails?: string[],
    isActive?: boolean,
    sortField?: string,
    sortOrder?: 'ASC' | 'DESC',
    dateFrom?: Date,
    dateTo?: Date,
    dateFilterParam?: string,
  ) {
    super(sortField, sortOrder, page, limit, dateFrom, dateTo, dateFilterParam);
    this.ids = ids ?? [];
    this.firstNames = firstNames ?? [];
    this.emails = emails ?? [];
    this.isActive = isActive;
  }
}
