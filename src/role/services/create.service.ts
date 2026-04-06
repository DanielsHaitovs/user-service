import { Permission } from '@/permissionEntities/permissions.entity';
import { PermissionHelperService } from '@/permissionServices/helper.service';
import { CreateRoleDto, RoleResponseDto } from '@/role/dto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userService/user/helper.service.';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CreateService {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    private readonly userHelper: UserHelperService,
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

    await this.userHelper.validateIfExists({ id: createdById });
    const permissionIds =
      await this.permissionHelper.validatePermissionsExist(permissions);

    const newRole = this.roleRepository.create(roleDto);

    newRole.createdBy = {
      id: createdById,
    } as User;

    newRole.permissions = permissionIds.map((id) => {
      return {
        id,
      } as Permission;
    });

    return await this.roleRepository.save(newRole);
  }
}
