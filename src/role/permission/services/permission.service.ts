import { PermissionResponseDto } from '@/permissionDto/permission.dto';
import { Permission } from '@/permissionEntities/permissions.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Retrieves a permission by its ID or throws an error if not found.
   * @param id - The UUID of the permission to retrieve.
   * @returns The PermissionResponseDto corresponding to the given ID.
   * @throws EntityNotFoundException if no permission with the given ID is found.
   */
  async getByIdOrThrow(id: UUID): Promise<PermissionResponseDto> {
    return await this.permissionRepository.findOneByOrFail({ id });
  }

  /**
   * Retrieves a permission by its code or throws an error if not found.
   * @param code - The code of the permission to retrieve.
   * @returns The PermissionResponseDto corresponding to the given code.
   * @throws EntityNotFoundException if no permission with the given code is found.
   */
  async getByCodeOrThrow(code: string): Promise<PermissionResponseDto> {
    return await this.permissionRepository.findOneByOrFail({ code });
  }
}
