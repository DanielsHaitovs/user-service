import { updatedResults } from '@/base/update';
import { UpdateRoleDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { RoleHelperService } from '@/roleServices/helper.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class UpdateService {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    private readonly roleHelper: RoleHelperService,
  ) {}

  async update({
    updateDto,
    id,
  }: {
    updateDto: UpdateRoleDto;
    id: UUID;
  }): Promise<boolean> {
    if (updateDto.name == undefined) {
      return false;
    }

    await this.validatePayload({
      name: updateDto.name,
      id,
    });

    const updatedRole = this.roleRepository.create(updateDto);

    const updated = await this.roleRepository.update(id, updatedRole);

    return updatedResults(updated);
  }

  private async validatePayload({
    name,
    id,
  }: {
    name: string;
    id: UUID;
  }): Promise<void> {
    await Promise.all([
      this.roleHelper.validateIfExist([id]),
      this.roleHelper.isUniqueNameOrThrow({ name, id }),
    ]);
  }
}
