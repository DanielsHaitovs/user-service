import { OptimizeCriteria } from '@/baseInterface/query.request';
import { EntityQueryService } from '@/baseServices/query.service';
import { PERMISSION_QUERY_ALIAS } from '@/libConst/permission.const';
import { ROLE_QUERY_ALIAS } from '@/libConst/role.const';
import { CREATEDBY_USER_QUERY_ALIAS } from '@/libConst/user.const';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryService extends EntityQueryService {
  permissionQueryCriteria({
    hasAccessToCreatedBy,
    includeCreatedBy,
    hasAccessToRoles,
    includeRoles,
  }: {
    hasAccessToCreatedBy: boolean;
    includeCreatedBy: boolean;
    hasAccessToRoles: boolean;
    includeRoles: boolean;
  }): Record<string, OptimizeCriteria> {
    return {
      [PERMISSION_QUERY_ALIAS]: {
        permissionAccess: true,
        includeRelation: true,
      },
      [ROLE_QUERY_ALIAS]: {
        permissionAccess: hasAccessToRoles,
        includeRelation: includeRoles,
      },
      [CREATEDBY_USER_QUERY_ALIAS]: {
        permissionAccess: hasAccessToCreatedBy,
        includeRelation: includeCreatedBy,
      },
    };
  }
}
