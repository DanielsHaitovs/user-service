import { UserQueryRequest } from '@/userDto/query.dto';
import {
  CreateUserDto,
  GetUserDto,
  UpdateUserDto,
  UserListResponseDto,
  UserResponseDto,
} from '@/userDto/user.dto';
import { CacheService } from '@/userServices/cache.service';
import { CreateService } from '@/userServices/create.service';
import { DeleteService } from '@/userServices/delete.service';
import { UpdateService } from '@/userServices/update.service';
import { UserService } from '@/userServices/user.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class UserPipelineService {
  constructor(
    private readonly userService: UserService,
    private readonly createService: CreateService,
    private readonly updateService: UpdateService,
    private readonly deleteService: DeleteService,
    private readonly cacheService: CacheService,
  ) {}

  async getMany(data: UserQueryRequest): Promise<UserListResponseDto> {
    return await this.userService.getMany(data);
  }

  async getByIdOrThrow(id: UUID): Promise<GetUserDto> {
    const cached = await this.cacheService.getById(id);

    if (cached) {
      return cached;
    }

    const user = await this.userService.getByIdOrThrow(id);

    await this.cacheService.set(user);

    return user;
  }

  async getByEmailOrThrow(email: string): Promise<GetUserDto> {
    const cached = await this.cacheService.getByEmail(email);

    if (cached) {
      return cached;
    }

    const user = await this.userService.getByEmailOrThrow(email);

    await this.cacheService.set(user);

    return user;
  }

  async create({
    createDto,
    createdById,
  }: {
    createDto: CreateUserDto;
    createdById: UUID;
  }): Promise<UserResponseDto> {
    const user = await this.createService.create({ createDto, createdById });

    await this.cacheService.set(user);

    return user;
  }

  async update({
    id,
    data,
  }: {
    id: UUID;
    data: UpdateUserDto;
  }): Promise<boolean> {
    const updated = await this.updateService.update({ id, data });

    if (updated) {
      await this.cacheService.revalidate({ id });
    }

    return updated;
  }

  async delete({
    id,
    canRemoveFromRelatedRoles,
    canRemoveFromRelatedStores,
  }: {
    id: UUID;
    canRemoveFromRelatedRoles: boolean;
    canRemoveFromRelatedStores: boolean;
  }): Promise<boolean> {
    const deleted = await this.deleteService.delete({
      id,
      canRemoveFromRelatedRoles,
      canRemoveFromRelatedStores,
    });

    if (deleted) {
      await this.cacheService.invalidate({ id });
    }

    return deleted;
  }
}
