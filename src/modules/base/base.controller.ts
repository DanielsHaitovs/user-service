/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
import { hasPermissions } from '@/auth/helper/permission.helper';
import { JWTPayload } from '@/auth/interfaces/req.interface';
import { UserAccessPermissions } from '@/base/interface/query.request';
import { AuthenticationGuard } from '@/common/guards/auth.guard';
import { PermissionsGuard } from '@/common/guards/permission.guard';
import {
  CREATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  READ_DEPARTMENT,
  UPDATE_DEPARTMENT,
} from '@/lib/const/department.const';
import {
  CREATE_PERMISSION,
  CREATE_ROLE,
  DELETE_PERMISSION,
  DELETE_ROLE,
  READ_PERMISSION,
  READ_ROLE,
  UPDATE_PERMISSION,
  UPDATE_ROLE,
} from '@/lib/const/role.const';
import {
  CREATE_USER,
  CREATE_USER_ROLE,
  DELETE_USER,
  DELETE_USER_ROLE,
  READ_USER,
  READ_USER_ROLE,
  UPDATE_USER,
  UPDATE_USER_ROLE,
} from '@/lib/const/user.const';
import { UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { UUID } from 'crypto';

@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, PermissionsGuard)
export abstract class BaseController<
  TCreateDto,
  TFindByIdsQuery,
  TSearchControl,
  TUpdateDto,
  TResponseDto,
  TListResponseDto,
  TQueryFilter,
> {
  abstract create(
    createDto: TCreateDto,
    createdByUser: JWTPayload,
  ): Promise<TResponseDto>;

  abstract findByIds(
    query: TFindByIdsQuery,
    requestedByUser: JWTPayload,
  ): Promise<TListResponseDto>;

  abstract search(
    value: string,
    control: TSearchControl,
  ): Promise<TListResponseDto>;

  abstract updateById(id: UUID, updateDto: TUpdateDto): Promise<TResponseDto>;

  abstract delete(
    ids: UUID[],
    requestedByUserId: UUID,
  ): Promise<{ deleted: number; message: string }>;

  abstract filter(
    filters: TQueryFilter,
    requestedByUser: JWTPayload,
  ): Promise<TListResponseDto>;

  protected extractAccess(createdByUser: JWTPayload): UserAccessPermissions {
    const { permissions: userPermissions } = createdByUser;

    return {
      hasAccessToRoles: this.has(userPermissions, READ_ROLE),
      canEditRoles: this.has(userPermissions, UPDATE_ROLE),
      canDeleteRoles: this.has(userPermissions, DELETE_ROLE),
      canCreateRoles: this.has(userPermissions, CREATE_ROLE),
      hasAccessToPermissions: this.has(userPermissions, READ_PERMISSION),
      canEditPermissions: this.has(userPermissions, UPDATE_PERMISSION),
      canDeletePermissions: this.has(userPermissions, DELETE_PERMISSION),
      canCreatePermissions: this.has(userPermissions, CREATE_PERMISSION),
      hasAccessToDepartments: this.has(userPermissions, READ_DEPARTMENT),
      canEditDepartments: this.has(userPermissions, UPDATE_DEPARTMENT),
      canDeleteDepartments: this.has(userPermissions, DELETE_DEPARTMENT),
      canCreateDepartments: this.has(userPermissions, CREATE_DEPARTMENT),
      hasAccessToUserRoles: this.has(userPermissions, READ_USER_ROLE),
      canEditUserRoles: this.has(userPermissions, UPDATE_USER_ROLE),
      canDeleteUserRoles: this.has(userPermissions, DELETE_USER_ROLE),
      canCreateUserRoles: this.has(userPermissions, CREATE_USER_ROLE),
      hasAccessToUsers: this.has(userPermissions, READ_USER),
      canEditUsers: this.has(userPermissions, UPDATE_USER),
      canDeleteUsers: this.has(userPermissions, DELETE_USER),
      canCreateUsers: this.has(userPermissions, CREATE_USER),
    };
  }

  private has(userPermissions: string[], permission: string): boolean {
    return hasPermissions({
      userPermissions,
      requestedPermissions: [permission],
    });
  }
}
