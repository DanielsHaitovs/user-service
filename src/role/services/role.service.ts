import { Permission } from '@/permissionEntities/permissions.entity';
import { PermissionHelperService } from '@/permissionServices/helper.service';
import { GetRoleDto, RoleResponseDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    private readonly permissionHelper: PermissionHelperService,
  ) {}

  /**
   * Retrieves a role by its ID or throws an exception if not found.
   * @param id - The UUID of the role to retrieve.
   * @returns A promise that resolves to the GetRoleDto of the found role.
   * @throws EntityNotFoundException if no role with the given ID is found.
   */
  async getByIdOrThrow(id: UUID): Promise<GetRoleDto> {
    return await this.roleRepository.findOneByOrFail({ id });
  }

  /**
   * Retrieves a role by its name or throws an exception if not found.
   * @param name - The name of the role to retrieve.
   * @returns A promise that resolves to the GetRoleDto of the found role.
   * @throws EntityNotFoundException if no role with the given name is found.
   */
  async getByNameOrThrow(name: string): Promise<GetRoleDto> {
    return await this.roleRepository.findOneByOrFail({ name });
  }

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
   * @returns A promise that resolves to the RoleResponseDto containing the updated role and its permissions.
   * @throws EntityNotFoundException if no role with the given ID is found.
   * @throws UnprocessableEntityException if any of the provided permission codes do not exist.
   * @throws UnprocessableEntityException if no permission codes are provided.
   */
  async assignPermissionsToRole({
    roleId,
    permissionCodes,
  }: {
    roleId: UUID;
    permissionCodes: string[];
  }): Promise<RoleResponseDto> {
    if (!permissionCodes.length) {
      throw new UnprocessableEntityException(
        'At least one permission code must be provided to assign permissions to the role.',
      );
    }

    const { permissions } = await this.getPermissionsOrThrow(roleId);

    if (permissions.length) {
      permissionCodes = permissions
        .filter((permission) => !permissionCodes.includes(permission.code))
        .flatMap((p) => p.code);
    }

    const permissionIds = [
      ...(await this.permissionHelper.validatePermissionsExist(
        permissionCodes,
      )),
      ...permissions.flatMap((p) => p.id),
    ] as UUID[];

    await this.roleRepository.save({
      id: roleId,
      permissions: permissionIds.map((id) => {
        return {
          id,
        } as Permission;
      }),
    });

    return await this.getPermissionsOrThrow(roleId);
  }

  /**
   * Unassigns permissions from a role.
   * @param roleId - The UUID of the role from which permissions will be unassigned.
   * @param permissionCodes - An array of permission codes to unassign from the role.
   * @returns A promise that resolves to the RoleResponseDto containing the updated role and its remaining permissions.
   * @throws EntityNotFoundException if no role with the given ID is found.
   * @throws UnprocessableEntityException if any of the provided permission codes are not currently assigned to the role.
   * @throws UnprocessableEntityException if no permission codes are provided.
   */
  async unassignPermissionsFromRole({
    roleId,
    permissionCodes,
  }: {
    roleId: UUID;
    permissionCodes: string[];
  }): Promise<RoleResponseDto> {
    if (!permissionCodes.length) {
      throw new UnprocessableEntityException(
        'At least one permission code must be provided to unassign permissions from the role.',
      );
    }

    const { permissions } = await this.getPermissionsOrThrow(roleId);

    const remainingPermissionIds = permissions
      .filter((permission) => !permissionCodes.includes(permission.code))
      .flatMap((p) => p.id);

    if (remainingPermissionIds.length === permissions.length) {
      throw new UnprocessableEntityException(
        'None of the provided permission codes are currently assigned to the role.',
      );
    }

    await this.roleRepository.save({
      id: roleId,
      permissions: remainingPermissionIds.map((id) => {
        return {
          id,
        } as Permission;
      }),
    });

    return await this.getPermissionsOrThrow(roleId);
  }
}
