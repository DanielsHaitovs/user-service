import {
  CreatePermissionDto,
  UpdatePermissionDto,
} from '@/permissionDto/permission.dto';
import { Permission } from '@/permissionEntities/permissions.entity';
import { Roles } from '@/roleEntities/role.entity';
import { User } from '@/userEntities/user.entity';
import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { In, Not, Repository } from 'typeorm';

@Injectable()
export class PermissionHelperService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Validates that a permission with the given codes do not already exist.
   * @param codes - The codes of the permissions to validate.
   * @returns The IDs of the existing permissions with the given codes.
   * @throws UnprocessableEntityException if any of the provided permission codes do not exist.
   */
  async manyExistByCodeOrThrow(codes?: string[]): Promise<UUID[]> {
    if (codes == undefined || codes.length === 0) {
      return [];
    }

    const existingPermissions = await this.permissionRepository.find({
      where: {
        code: In(codes),
      },
    });

    if (existingPermissions.length != codes.length) {
      throw new UnprocessableEntityException(
        `Failed to create role. The following permission codes do not exist: ${codes
          .filter((code) => !existingPermissions.some((p) => p.code === code))
          .join(', ')}`,
      );
    }

    return existingPermissions.map((p) => p.id);
  }

  /**
   * Validates that a permission with the given ID exists.
   * @param id - The ID of the permission to validate.
   * @throws UnprocessableEntityException if a permission with the given ID does not exist.
   */
  async validateIfExistOrThrow(id: UUID): Promise<void> {
    await this.permissionRepository.findOneOrFail({
      where: {
        id,
      },
    });
  }

  /**
   * Validates that a permission with the given name does not already exist (excluding the permission with the given ID).
   * @param name - The name of the permission to validate.
   * @param id - The ID of the permission to exclude from the validation.
   * @throws ConflictException if a permission with the same name already exists (excluding the current permission).
   */
  async isUniqueNameOrThrow({
    name,
    id,
  }: {
    name: string;
    id: UUID;
  }): Promise<void> {
    const existingPermission = await this.permissionRepository.findOne({
      where: {
        name,
        id: Not(id),
      },
    });

    if (existingPermission) {
      throw new ConflictException(
        `A permission with the name "${name}" already exists.`,
      );
    }
  }

  /**
   * Prepares a Permission entity based on the provided data, creator ID, and role IDs.
   * @param data - The data to create or update the permission with.
   * @param createdById - The ID of the user creating the permission (optional).
   * @param roleIds - The IDs of the roles to which this permission belongs (optional).
   * @returns A Partial<Permission> object ready to be saved to the database.
   */
  prepareObject({
    data,
    createdById,
    roleIds,
  }: {
    data: CreatePermissionDto | UpdatePermissionDto;
    createdById?: UUID | undefined;
    roleIds?: UUID[] | undefined;
  }): Partial<Permission> {
    const permission = this.permissionRepository.create(data);

    if (createdById != undefined) {
      permission.createdBy = {
        id: createdById,
      } as User;
    }

    if (roleIds != undefined) {
      permission.roles = roleIds.map((id) => {
        return {
          id,
        } as Roles;
      });
    }

    return permission;
  }
}
