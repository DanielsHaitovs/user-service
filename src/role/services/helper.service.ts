import { EntityQueryService } from '@/base/service/query.service';
import { Roles } from '@/roleEntities/role.entity';
import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { In, Not, Repository } from 'typeorm';

@Injectable()
export class RoleHelperService {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    private readonly queryService: EntityQueryService,
  ) {}

  /**
   * Validates that a role with the given name does not already exist, excluding an optional ID.
   * @param name - The name of the role to validate for uniqueness.
   * @param id - An optional ID to exclude from the uniqueness check (useful for updates).
   * @throws ConflictException if a role with the given name already exists (excluding the specified ID).
   */
  async isUniqueNameOrThrow({
    name,
    id,
  }: {
    name: string;
    id?: UUID | undefined;
  }): Promise<boolean> {
    const existingRole = await this.roleRepository.findOne({
      where: {
        name,
        ...(id != undefined ? { id: Not(id) } : {}),
      },
    });

    if (existingRole) {
      throw new ConflictException(
        `A role with the name "${name}" already exists.`,
      );
    }

    return true;
  }

  /**
   * Validates that a role with the given ids do not already exist.
   * @param ids - The ids of the roles to validate.
   * @returns The IDs of the existing roles with the given names.
   * @throws UnprocessableEntityException if any of the provided role names do not exist.
   */
  async validateIfExist(ids?: string[]): Promise<void> {
    if (ids == undefined || ids.length === 0) {
      throw new UnprocessableEntityException(
        'Failed to validate if role exists: At least one role id must be provided for validation',
      );
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
