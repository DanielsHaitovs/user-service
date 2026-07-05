import { EntityQueryService } from '@/baseServices/query.service';
import { PERMISSION_QUERY_ALIAS } from '@/commonConst/permission.const';
import { ROLE_QUERY_ALIAS } from '@/commonConst/role.const';
import { Roles } from '@/roleEntities/role.entity';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
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
   * Validates that all role IDs in the provided array exist in the database.
   * @param ids - An array of role IDs (UUIDs) to validate.
   * @returns A promise that resolves to an array of valid role IDs if all exist.
   * @throws UnprocessableEntityException if any of the provided role IDs do not exist.
   */
  async checkIfManyExistOrThrow(ids?: string[]): Promise<UUID[]> {
    if (ids == undefined || ids.length === 0) {
      throw new UnprocessableEntityException('No role ids provided.');
    }

    const existingRoles = await this.roleRepository.find({
      where: {
        id: In(ids),
      },
      select: ['id'],
    });

    if (existingRoles.length != ids.length) {
      throw new UnprocessableEntityException(
        `Failed to validate role. The following role ids do not exist: ${ids
          .filter((id) => !existingRoles.some((r) => r.id === id))
          .join(', ')}`,
      );
    }

    return existingRoles.map((r) => r.id);
  }

  /**
   * Retrieves all unique permission codes associated with the given role IDs.
   * @param roleIds - An array of UUIDs representing the role IDs to retrieve permissions for.
   * @returns A promise that resolves to an array of unique permission codes associated with the specified roles.
   */
  async getAllPermissions(roleIds: UUID[]): Promise<string[]> {
    const query = this.roleRepository
      .createQueryBuilder(ROLE_QUERY_ALIAS)
      .leftJoinAndSelect(
        `${ROLE_QUERY_ALIAS}.${PERMISSION_QUERY_ALIAS}`,
        'permission',
      )
      .where(`${ROLE_QUERY_ALIAS}.id IN (:...roleIds)`, { roleIds })
      .select([`${ROLE_QUERY_ALIAS}.id`, 'permission.code']);

    const roles = await this.queryService.getAll<Roles>({
      query,
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
