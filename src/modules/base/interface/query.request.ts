import type { PaginationDto, SortDto } from '@/base/dto/pagination.dto';

import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface OptimizeCriteria {
  permissionAccess: boolean;
  includeRelation: boolean;
  nestedFrom?: string;
}

export interface QueryRequest<T extends ObjectLiteral> {
  query: SelectQueryBuilder<T>;
  pagination: PaginationDto;
  sort: SortDto | undefined;
  select: string[] | undefined;
  criteria: Record<string, OptimizeCriteria>;
}
