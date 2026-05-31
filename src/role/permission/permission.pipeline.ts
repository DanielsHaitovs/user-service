import { GetPermissionDto } from '@/permissionDto/permission.dto';
import { PermissionService } from '@/permissionServices/permission.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class PermissionPipelineService {
  constructor(private readonly permissionService: PermissionService) {}

  async getByIdOrThrow(id: UUID): Promise<GetPermissionDto> {
    return await this.permissionService.getByIdOrThrow(id);
  }

  async getByCodeOrThrow(code: string): Promise<GetPermissionDto> {
    return await this.permissionService.getByCodeOrThrow(code);
  }
}
