import {
  CreatePermissionDto,
  GetPermissionDto,
  PermissionResponseDto,
} from '@/permissionDto/permission.dto';
import { CreateService } from '@/permissionServices/create.service';
import { PermissionService } from '@/permissionServices/permission.service';
import { UpdateService } from '@/permissionServices/update.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class PermissionPipelineService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly createService: CreateService,
    private readonly updateService: UpdateService,
  ) {}

  async getByIdOrThrow(id: UUID): Promise<GetPermissionDto> {
    return await this.permissionService.getByIdOrThrow(id);
  }

  async getByCodeOrThrow(code: string): Promise<GetPermissionDto> {
    return await this.permissionService.getByCodeOrThrow(code);
  }

  async create({
    createDto,
    createdById,
  }: {
    createDto: CreatePermissionDto;
    createdById: UUID;
  }): Promise<PermissionResponseDto> {
    return await this.createService.create({ createDto, createdById });
  }

  async updateName({ name, id }: { name: string; id: UUID }): Promise<boolean> {
    return await this.updateService.update({ updateDto: { name }, id });
  }
}
