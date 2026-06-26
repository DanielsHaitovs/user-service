import { updatedResults } from '@/base/helper/update';
import { GetRoleDto, UpdateRoleDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Not, Repository } from 'typeorm';

@Injectable()
export class UpdateService {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
  ) {}

  async update({
    updateDto,
    role,
  }: {
    updateDto: UpdateRoleDto;
    role: GetRoleDto;
  }): Promise<boolean> {
    if (updateDto.name == undefined) {
      return false;
    }

    if (
      !(await this.isUniqueNameOrThrow({
        updateDto,
        role,
      }))
    ) {
      return false;
    }

    const updatedRole = this.roleRepository.create(updateDto);

    const updated = await this.roleRepository.update(role.id, updatedRole);

    return updatedResults(updated);
  }

  /**
   * Validates that a role with the given name does not already exist, excluding the role with the provided ID.
   * @param updateDto - The data transfer object containing the updated role details, including the name to validate for uniqueness.
   * @param id - The ID of the role to exclude from the uniqueness check (useful for updates).
   * @throws UnprocessableEntityException if a name was not specified.
   * @throws ConflictException if a role with the given name already exists (excluding the specified ID).
   * @returns A boolean indicating whether the name is unique (true) or if name did not change.
   */
  private async isUniqueNameOrThrow({
    updateDto,
    role,
  }: {
    updateDto: UpdateRoleDto;
    role: GetRoleDto;
  }): Promise<boolean> {
    const { name } = updateDto;

    if (name == undefined) {
      throw new UnprocessableEntityException('Name is required for update.');
    }

    if (role.name === updateDto.name) {
      return false;
    }

    const existingRole = await this.roleRepository.findOne({
      where: {
        name,
        id: Not(role.id),
      },
    });

    if (existingRole) {
      throw new UnprocessableEntityException(
        `A role with the name "${name}" already exists.`,
      );
    }

    return true;
  }
}
