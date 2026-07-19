import { GetPermissionDto } from '@/permissionDto/permission.dto';
import { Permission } from '@/permissionEntities/permissions.entity';
import { PermissionHelperService } from '@/permissionServices/helper.service';
import { CreateRoleDto, RoleResponseDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { User } from '@/userEntities/user.entity';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CreateService {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    private readonly permissionHelper: PermissionHelperService,
  ) {}

  /**
   * Creates a new role with the provided details and assigns the creator.
   * Validates that all specified permissions exist before creating the role.
   *
   * @param createDto - The details of the role to create, including name and associated permissions.
   * @param createdById - The ID of the user creating this new role.
   * @returns The created Role entity.
   * @throws UnprocessableEntityException if any of the specified permission codes do not exist.
   * @throws EntityNotFoundException if the creator user is not found.
   */
  async create({
    createDto,
    createdById,
  }: {
    createDto: CreateRoleDto;
    createdById: UUID;
  }): Promise<RoleResponseDto> {
    const { permissions, ...roleDto } = createDto;

    const permissionToAssign = await this.validatePayload({
      name: roleDto.name,
      permissions,
    });

    const newRole = this.roleRepository.create(roleDto);

    newRole.createdBy = {
      id: createdById,
    } as User;

    newRole.permissions = permissionToAssign as Permission[];

    return await this.roleRepository.save(newRole);
  }

  private async validatePayload({
    name,
    permissions,
  }: {
    name: string;
    permissions?: string[] | undefined;
  }): Promise<GetPermissionDto[]> {
    const [permissionToAssign] = await Promise.all([
      permissions != undefined && permissions.length > 0
        ? this.permissionHelper.checkIfManyExistOrThrow(permissions)
        : [],
      this.isUniqueNameOrThrow(name),
    ]);

    return permissionToAssign;
  }

  /**
   * Validates that a role with the given name does not already exist, excluding an optional ID.
   * @param name - The name of the role to validate for uniqueness.
   * @throws ConflictException if a role with the given name already exists (excluding the specified ID).
   */
  private async isUniqueNameOrThrow(name: string): Promise<void> {
    const existingRole = await this.roleRepository.findOne({
      where: {
        name,
      },
    });

    if (existingRole) {
      throw new ConflictException(
        `A role with the name "${name}" already exists.`,
      );
    }
  }
}
