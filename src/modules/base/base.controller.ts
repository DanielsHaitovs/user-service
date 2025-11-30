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
  DELETE_PERMISSION,
  READ_PERMISSION,
  UPDATE_PERMISSION,
} from '@/lib/const/permission.const';
import {
  CREATE_ROLE,
  DELETE_ROLE,
  READ_ROLE,
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
> {
  abstract create(
    createDto: TCreateDto | TCreateDto[],
    createdByUser: JWTPayload,
  ): Promise<TResponseDto | TResponseDto[]>;

  abstract findByIds(
    query: TFindByIdsQuery,
    requestedByUser: JWTPayload,
  ): Promise<TListResponseDto>;

  abstract search(
    value: string,
    control: TSearchControl,
    requestedByUserId: UUID,
  ): Promise<TListResponseDto>;

  abstract updateById(id: UUID, updateDto: TUpdateDto): Promise<TResponseDto>;

  abstract delete(
    ids: UUID[],
    requestedByUserId: UUID,
  ): Promise<{ deleted: number; message: string }>;

  protected extractAccess(createdByUser: JWTPayload): UserAccessPermissions {
    const { permissions, id } = createdByUser;

    return {
      id,
      hasAccessToRoles: this.has(permissions, READ_ROLE),
      canEditRoles: this.has(permissions, UPDATE_ROLE),
      canDeleteRoles: this.has(permissions, DELETE_ROLE),
      canCreateRoles: this.has(permissions, CREATE_ROLE),
      hasAccessToPermissions: this.has(permissions, READ_PERMISSION),
      canEditPermissions: this.has(permissions, UPDATE_PERMISSION),
      canDeletePermissions: this.has(permissions, DELETE_PERMISSION),
      canCreatePermissions: this.has(permissions, CREATE_PERMISSION),
      hasAccessToDepartments: this.has(permissions, READ_DEPARTMENT),
      canEditDepartments: this.has(permissions, UPDATE_DEPARTMENT),
      canDeleteDepartments: this.has(permissions, DELETE_DEPARTMENT),
      canCreateDepartments: this.has(permissions, CREATE_DEPARTMENT),
      hasAccessToUserRoles: this.has(permissions, READ_USER_ROLE),
      canEditUserRoles: this.has(permissions, UPDATE_USER_ROLE),
      canDeleteUserRoles: this.has(permissions, DELETE_USER_ROLE),
      canCreateUserRoles: this.has(permissions, CREATE_USER_ROLE),
      hasAccessToUsers: this.has(permissions, READ_USER),
      canEditUsers: this.has(permissions, UPDATE_USER),
      canDeleteUsers: this.has(permissions, DELETE_USER),
      canCreateUsers: this.has(permissions, CREATE_USER),
    };
  }

  private has(userPermissions: string[], permission: string): boolean {
    return hasPermissions({
      userPermissions,
      requestedPermissions: [permission],
    });
  }
}
