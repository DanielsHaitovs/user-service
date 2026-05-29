import { updatedResults } from '@/base/update';
import { UpdatePermissionDto } from '@/permissionDto/permission.dto';
import { Permission } from '@/permissionEntities/permissions.entity';
import { PermissionHelperService } from '@/permissionServices/helper.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class UpdateService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly permissionHelper: PermissionHelperService,
  ) {}

  /**
   * Updates an existing permission with the provided data.
   *
   * Validates that the permission with the given ID exists, then updates its properties
   * based on the provided UpdatePermissionDto. Returns true if the update was successful,
   * or false if no records were affected.
   *
   * @param updateDto - The data to update the permission with
   * @param id - The ID of the permission to update
   * @returns A boolean indicating whether the update was successful
   * @throws ConflictException if a permission with the same code already exists (excluding the current permission)
   * @throws UnprocessableEntityException if the permission with the given ID does not exist
   */
  async update({
    updateDto,
    id,
  }: {
    updateDto: UpdatePermissionDto;
    id: UUID;
  }): Promise<boolean> {
    await this.validatePayload({
      id,
      name: updateDto.name,
    });

    const newPermission = this.permissionHelper.prepareObject({
      data: updateDto,
    });

    const updated = await this.permissionRepository.update(id, newPermission);

    return updatedResults(updated);
  }

  private async validatePayload({
    id,
    name,
  }: {
    id: UUID;
    name: string;
  }): Promise<void> {
    await Promise.all([
      this.permissionHelper.validateIfExistOrThrow(id),
      this.permissionHelper.isUniqueNameOrThrow({
        name,
        id,
      }),
    ]);
  }
}
