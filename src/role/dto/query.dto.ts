import { QueryRequestDto } from '@/baseDto/pagination.dto';
import { EXAMPLE_ROLE_ID } from '@/commonConst/role.const';
import { ToArray } from '@/commonDecorators/array.decorator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsOptional, IsString, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class RolesQueryRequest extends QueryRequestDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    isArray: true,
    title: 'Role IDs',
    description: 'Role IDs - must be valid UUIDs of existing roles',
    example: [EXAMPLE_ROLE_ID],
    required: true,
  })
  @ToArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  ids?: UUID[];

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    title: 'Role Names',
    description: 'Role Names - must be valid strings of existing roles',
    example: ['Admin', 'User'],
    required: true,
  })
  @ToArray()
  @IsString({ each: true })
  @IsOptional()
  names?: string[];

  constructor(
    page: number,
    limit: number,
    ids?: UUID[],
    names?: string[],
    sortField?: string,
    sortOrder?: 'ASC' | 'DESC',
    dateFrom?: Date,
    dateTo?: Date,
    dateFilterParam?: string,
  ) {
    super(sortField, sortOrder, page, limit, dateFrom, dateTo, dateFilterParam);
    this.ids = ids ?? [];
    this.names = names ?? [];
  }
}
