import { EntityQueryService } from '@/base/service/query.service';
import { Roles } from '@/roleEntities/role.entity';
import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { In, Repository } from 'typeorm';

@Injectable()
export class RoleHelperService {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    private readonly queryService: EntityQueryService,
  ) {}

  /**
   * Validates that a role with the given name does not already exist.
   * @param name - The name of the role to validate.
   * @throws ConflictException if a role with the given name already exists.
   */
  async throwIfExists(name: string[]): Promise<void> {
    const existingRoles = await this.roleRepository.find({
      where: {
        name: In(name),
      },
    });

    if (existingRoles.length) {
      throw new ConflictException(
        `A role with the name(s) "${name.join(', ')}" already exists.`,
      );
    }
  }

  /**
   * Validates that a role with the given ids do not already exist.
   * @param ids - The ids of the roles to validate.
   * @returns The IDs of the existing roles with the given names.
   * @throws UnprocessableEntityException if any of the provided role names do not exist.
   */
  async validateIfExist(ids?: string[]): Promise<UUID[]> {
    if (ids == undefined || ids.length === 0) {
      return [];
    }

    const existingRoles = await this.roleRepository.find({
      where: {
        id: In(ids),
      },
    });

    if (existingRoles.length != ids.length) {
      throw new UnprocessableEntityException(
        `Failed to create role. The following role ids do not exist: ${ids
          .filter((id) => !existingRoles.some((r) => r.id === id))
          .join(', ')}`,
      );
    }

    return existingRoles.map((r) => r.id);
  }

  /**
   * Retrieves all unique permission codes associated with the given role IDs.
   * @param roleIds - An array of role IDs for which to retrieve permissions.
   * @returns A promise that resolves to an array of unique permission codes.
   */
  async getAllPermissions(roleIds: UUID[]): Promise<string[]> {
    const query = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .where('role.id IN (:...roleIds)', { roleIds })
      .select(['role.id', 'permission.code']);

    const roles = await this.queryService.getAll<Roles>({
      query,
      cache: true,
    });

    const permissionCodes = new Set<string>();

    roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        permissionCodes.add(permission.code);
      });
    });

    return Array.from(permissionCodes);
  }
}
