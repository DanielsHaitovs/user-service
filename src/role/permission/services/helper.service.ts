import { GetPermissionDto } from '@/permissionDto/permission.dto';
import { Permission } from '@/permissionEntities/permissions.entity';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';

@Injectable()
export class PermissionHelperService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Validates that a permission with the given codes do not already exist.
   * @param codes - The codes of the permissions to validate.
   * @returns The IDs of the existing permissions with the given codes.
   * @throws UnprocessableEntityException if any of the provided permission codes do not exist.
   */
  async checkIfManyExistOrThrow(codes?: string[]): Promise<GetPermissionDto[]> {
    if (codes == undefined || codes.length === 0) {
      throw new UnprocessableEntityException('No permission codes provided.');
    }

    const existingPermissions = await this.permissionRepository.find({
      where: {
        code: In(codes),
      },
    });

    if (existingPermissions.length != codes.length) {
      throw new UnprocessableEntityException(
        `The following permission codes do not exist: ${codes
          .filter((code) => !existingPermissions.some((p) => p.code === code))
          .join(', ')}`,
      );
    }

    return existingPermissions;
  }
}
