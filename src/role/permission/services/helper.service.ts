import { Permission } from '@/permissionEntities/permissions.entity';
import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { In, Repository } from 'typeorm';

@Injectable()
export class PermissionHelperService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Validates that a permission with the given code does not already exist.
   * @param code - The code of the permission to validate.
   * @throws ConflictException if a permission with the given code already exists.
   */
  async throwIfExists(code: string[]): Promise<void> {
    const existingPermissions = await this.permissionRepository.find({
      where: {
        code: In(code),
      },
    });

    if (existingPermissions.length) {
      throw new ConflictException(
        `A permission with the code(s) "${code.join(', ')}" already exists.`,
      );
    }
  }

  /**
   * Validates that a permission with the given codes do not already exist.
   * @param codes - The codes of the permissions to validate.
   * @returns The IDs of the existing permissions with the given codes.
   * @throws UnprocessableEntityException if any of the provided permission codes do not exist.
   */
  async validatePermissionsExist(codes?: string[]): Promise<UUID[]> {
    if (codes == undefined || codes.length === 0) {
      return [];
    }

    const existingPermissions = await this.permissionRepository.find({
      where: {
        code: In(codes),
      },
    });

    if (existingPermissions.length != codes.length) {
      throw new UnprocessableEntityException(
        `Failed to create role. The following permission codes do not exist: ${codes
          .filter((code) => !existingPermissions.some((p) => p.code === code))
          .join(', ')}`,
      );
    }

    return existingPermissions.map((p) => p.id);
  }
}
