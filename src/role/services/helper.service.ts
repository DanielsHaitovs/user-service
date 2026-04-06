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
   * Validates that a role with the given names do not already exist.
   * @param names - The names of the roles to validate.
   * @returns The IDs of the existing roles with the given names.
   * @throws UnprocessableEntityException if any of the provided role names do not exist.
   */
  async validateRolesExist(names?: string[]): Promise<UUID[]> {
    if (names == undefined || names.length === 0) {
      return [];
    }

    const existingRoles = await this.roleRepository.find({
      where: {
        name: In(names),
      },
    });

    if (existingRoles.length != names.length) {
      throw new UnprocessableEntityException(
        `Failed to create role. The following role names do not exist: ${names
          .filter((name) => !existingRoles.some((r) => r.name === name))
          .join(', ')}`,
      );
    }

    return existingRoles.map((r) => r.id);
  }
}
