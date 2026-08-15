import { Permission } from '@/permissionEntities/permissions.entity';
import { PermissionHelperService } from '@/permissionServices/helper.service';
import { PermissionsToRoleDto, RoleResponseDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    private readonly permissionHelper: PermissionHelperService,
  ) {}

  /**
   * Retrieves a role along with its associated permissions by the role's ID.
   * @param roleId - The UUID of the role to retrieve.
   * @returns A promise that resolves to the RoleResponseDto containing the role and its permissions.
   * @throws EntityNotFoundException if no role with the given ID is found.
   */
  async getPermissionsOrThrow(roleId: UUID): Promise<RoleResponseDto> {
    return await this.roleRepository.findOneOrFail({
      where: { id: roleId },
      relations: ['permissions'],
    });
  }

  /**
   * Assigns permissions to a role.
   * @param roleId - The UUID of the role to which permissions will be assigned.
   * @param permissionCodes - An array of permission codes to assign to the role.
   * @returns A promise that resolves when the permissions have been successfully assigned to the role.
   * @throws EntityNotFoundException if no role with the given ID is found.
   * @throws UnprocessableEntityException if any of the provided permission codes do not exist.
   * @throws UnprocessableEntityException if no permission codes are provided.
   */
  async assignPermissionsToRole({
    assignPayload,
    role,
  }: {
    assignPayload: PermissionsToRoleDto;
    role: RoleResponseDto;
  }): Promise<void> {
    if (!assignPayload.permissionCodes.length) {
      throw new UnprocessableEntityException(
        'At least one permission code must be provided to assign permissions to the role.',
      );
    }
    const { permissions } = role;
    let { permissionCodes } = assignPayload;

    if (permissions.length) {
      permissionCodes = permissionCodes.filter(
        (code) => !permissions.some((p) => p.code === code),
      );
    }

    const permissionIds = [
      ...(permissionCodes.length > 0
        ? (
            await this.permissionHelper.checkIfManyExistOrThrow(permissionCodes)
          ).flatMap((p) => p.id)
        : []),
      ...permissions.flatMap((p) => p.id),
    ] as UUID[];

    if (
      permissionIds.length === 0 ||
      permissionIds.length === permissions.length
    ) {
      return;
    }

    await this.roleRepository.save({
      id: role.id,
      permissions: permissionIds.map((id) => {
        return {
          id,
        } as Permission;
      }),
    });
  }

  /**
   * Unassign permissions from a role.
   * @param roleId - The UUID of the role from which permissions will be unassigned.
   * @param permissionCodes - An array of permission codes to unassign from the role.
   * @returns A promise that resolves when the permissions have been successfully unassigned from the role.
   * @throws EntityNotFoundException if no role with the given ID is found.
   * @throws UnprocessableEntityException if any of the provided permission codes are not currently assigned to the role.
   * @throws UnprocessableEntityException if no permission codes are provided.
   */
  async unassignPermissionsFromRole({
    unassignPayload,
    role,
  }: {
    unassignPayload: PermissionsToRoleDto;
    role: RoleResponseDto;
  }): Promise<number> {
    if (!unassignPayload.permissionCodes.length) {
      throw new UnprocessableEntityException(
        'At least one permission code must be provided to unassign permissions from the role.',
      );
    }
    if (!role.permissions.length) {
      return 0;
    }

    const { permissions } = role;
    const { permissionCodes } = unassignPayload;

    const remainingPermissionIds = permissions
      .filter((permission) => !permissionCodes.includes(permission.code))
      .flatMap((p) => p.id);

    if (remainingPermissionIds.length === permissions.length) {
      throw new UnprocessableEntityException(
        'Some of the provided permission codes are not currently assigned to the role.',
      );
    }

    await this.roleRepository.save({
      id: role.id,
      permissions: remainingPermissionIds.map((id) => {
        return {
          id,
        } as Permission;
      }),
    });

    return permissions.length - remainingPermissionIds.length;
  }
}
