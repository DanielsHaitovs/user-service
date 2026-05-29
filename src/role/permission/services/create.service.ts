import {
  CreatePermissionDto,
  PermissionResponseDto,
} from '@/permissionDto/permission.dto';
import { Permission } from '@/permissionEntities/permissions.entity';
import { PermissionHelperService } from '@/permissionServices/helper.service';
import { RoleHelperService } from '@/roleServices/helper.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class CreateService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
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

    await this.validatePayload({
      code: permissionDto.code,
      roleIds,
    });

    const newPermission = this.permissionHelper.prepareObject({
      data: permissionDto,
      createdById,
      roleIds,
    });

    return await this.permissionRepository.save(newPermission);
  }

  private async validatePayload({
    code,
    roleIds,
  }: {
    code: string;
    roleIds: UUID[];
  }): Promise<void> {
    await Promise.all([
      this.permissionHelper.manyExistByCodeOrThrow([code]),
      this.roleHelper.validateIfExist(roleIds),
    ]);
  }
}
