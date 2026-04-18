import {
  CreatePermissionDto,
  PermissionResponseDto,
} from '@/permissionDto/permission.dto';
import { Permission } from '@/permissionEntities/permissions.entity';
import { PermissionHelperService } from '@/permissionServices/helper.service';
import { Roles } from '@/roleEntities/role.entity';
import { RoleHelperService } from '@/roleServices/helper.service';
import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userService/user/helper.service.';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CreateService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly userHelper: UserHelperService,
    private readonly permissionHelper: PermissionHelperService,
    private readonly roleHelper: RoleHelperService,
  ) {}

  /**
   * Creates a new permission and assigns it to the specified roles.
   * @param createDto - The details of the permission to create, including assigned role IDs.
   * @param createdById - The ID of the user creating the permission.
   * @returns The created permission.
   * @throws UnprocessableEntityException if any of the specified role IDs do not exist or if a permission with the same code already exists.
   * @throws UnprocessableEntityException if the creator user is not found.
   * @throws ConflictException if a permission with the same code already exists.
   */
  async create({
    createDto,
    createdById,
  }: {
    createDto: CreatePermissionDto;
    createdById: UUID;
  }): Promise<PermissionResponseDto> {
    const { roleIds, ...permissionDto } = createDto;

    await this.permissionHelper.throwIfExists([permissionDto.code]);
    await this.userHelper.validateIfExists({ id: createdById });
    await this.roleHelper.validateIfExist(roleIds);

    const newPermission = this.permissionRepository.create(permissionDto);

    newPermission.createdBy = {
      id: createdById,
    } as User;

    newPermission.roles = roleIds.map((id) => {
      return {
        id,
      } as Roles;
    });

    return await this.permissionRepository.save(newPermission);
  }
}
