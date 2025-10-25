import { PaginationDto, SortDto } from '@/base/dto/pagination.dto';
import { QueryService } from '@/base/service/query.service';
import { ROLE_QUERY_ALIAS } from '@/lib/const/role.const';
import { CREATEDBY_USER_QUERY_ALIAS } from '@/lib/const/user.const';
import { Permission } from '@/role/entities/permissions.entity';
import { Injectable } from '@nestjs/common';

import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class PermissionQueryService extends QueryService {
  optimize({
    query,
    pagination,
    hasAccessToUser,
    hasAccessToRole,
    includeCreatedBy,
    includeRole,
    select,
    order,
  }: {
    query: SelectQueryBuilder<Permission>;
    pagination: PaginationDto;
    hasAccessToUser: boolean;
    hasAccessToRole: boolean;
    includeCreatedBy: boolean;
    includeRole: boolean;
    select: string[] | undefined;
    order: SortDto | undefined;
  }): void {
    if (
      select != undefined &&
      select.length > 0 &&
      order?.sortField !== undefined
    ) {
      select.push(order.sortField);
    }

    this.validateRelationSelect<Permission>({
      query,
      select,
      hasAccess: hasAccessToUser && includeCreatedBy,
      relationAlias: CREATEDBY_USER_QUERY_ALIAS,
    });

    this.validateRelationSelect<Permission>({
      query,
      select,
      hasAccess: hasAccessToRole && includeRole,
      relationAlias: ROLE_QUERY_ALIAS,
    });

    this.validateSelect<Permission>({ query, select });

    this.validateOrder<Permission>({
      query,
      relations: {
        [ROLE_QUERY_ALIAS]: hasAccessToRole && includeRole,
        [CREATEDBY_USER_QUERY_ALIAS]: hasAccessToUser && includeCreatedBy,
      },
      order,
    });

    if (select != undefined && select.length > 0) {
      query.select(select);
    }

    this.sort<Permission>({ query, order });

    this.paginate<Permission>({ query, pagination });
  }
}
