import { QueryRequestDto } from '@/baseDto/pagination.dto';
import { ToArray } from '@/commonDecorators/array.decorator';
import { EXAMPLE_STORE_ID } from '@/lib/const/store.const';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsOptional, IsString, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class StoreQueryRequest extends QueryRequestDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    isArray: true,
    title: 'Store IDs',
    description: 'Store IDs - must be valid UUIDs of existing stores',
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
    title: 'Store Names',
    description: 'Store Names - must be valid strings of existing stores',
    example: ['Store1', 'Store2'],
    required: true,
  })
  @ToArray()
  @IsString({ each: true })
  @IsOptional()
  names?: string[];

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    title: 'Store Codes',
    description: 'Store Codes - must be valid strings of existing stores',
    example: ['store_de', 'store_us'],
    required: true,
  })
  @ToArray()
  @IsString({ each: true })
  @IsOptional()
  codes?: string[];

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    title: 'Store View Codes',
    description:
      'Store View Codes - must be valid strings of existing store views',
    example: ['de_de', 'us_en'],
    required: true,
  })
  @ToArray()
  @IsString({ each: true })
  @IsOptional()
  viewCodes?: string[];

  constructor(
    page: number,
    limit: number,
    ids?: UUID[],
    names?: string[],
    codes?: string[],
    viewCodes?: string[],
    sortField?: string,
    sortOrder?: 'ASC' | 'DESC',
    dateFrom?: Date,
    dateTo?: Date,
    dateFilterParam?: string,
  ) {
    super(sortField, sortOrder, page, limit, dateFrom, dateTo, dateFilterParam);
    this.ids = ids ?? [];
    this.names = names ?? [];
    this.codes = codes ?? [];
    this.viewCodes = viewCodes ?? [];
  }
}
