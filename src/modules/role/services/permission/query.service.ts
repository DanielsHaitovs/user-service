import { OptimizeCriteria } from '@/base/interface/query.request';
import { EntityQueryService } from '@/base/service/query.service';
import {
  PERMISSION_QUERY_ALIAS,
  ROLE_QUERY_ALIAS,
} from '@/lib/const/role.const';
import { CREATEDBY_USER_QUERY_ALIAS } from '@/lib/const/user.const';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryService extends EntityQueryService {
  permissionQueryCriteria({
    hasAccessToCreatedBy,
    includeCreatedBy,
    hasAccessToRole,
    includeRoles,
  }: {
    hasAccessToCreatedBy: boolean;
    includeCreatedBy: boolean;
    hasAccessToRole: boolean;
    includeRoles: boolean;
  }): Record<string, OptimizeCriteria> {
    return {
      [PERMISSION_QUERY_ALIAS]: {
        permissionAccess: true,
        includeRelation: true,
      },
      [ROLE_QUERY_ALIAS]: {
        permissionAccess: hasAccessToRole,
        includeRelation: includeRoles,
      },
      [CREATEDBY_USER_QUERY_ALIAS]: {
        permissionAccess: hasAccessToCreatedBy,
        includeRelation: includeCreatedBy,
      },
    };
  }
}
