import { CacheService } from '@/baseServices/cache.service';
import { USER_QUERY_ALIAS } from '@/commonConst/user.const';
import { UserQueryRequest } from '@/userDto/query.dto';
import {
  CreateUserDto,
  GetUserDto,
  UpdateUserDto,
  UserListResponseDto,
  UserResponseDto,
} from '@/userDto/user.dto';
import { CreateService } from '@/userServices/create.service';
import { DeleteService } from '@/userServices/delete.service';
import { UpdateService } from '@/userServices/update.service';
import { UserService } from '@/userServices/user.service';
import { Injectable, Logger } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class UserPipelineService {
  private readonly setEmailCacheKeyPrefix = `email:${USER_QUERY_ALIAS}:`;
  private readonly logger = new Logger(UserPipelineService.name);

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
    const cached = await this.cacheService.getById<GetUserDto>({
      id,
      alias: USER_QUERY_ALIAS,
    });

    if (cached) {
      return cached;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id,
      alias: USER_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<GetUserDto>({
      key: cacheKey,
      operation: async () => {
        const store = await this.userService.getByIdOrThrow(id);

        await this.cacheService.set<GetUserDto>({
          key: cacheKey,
          value: store,
        });

        return store;
      },
    });
  }

  async getByEmailOrThrow(email: string): Promise<GetUserDto> {
    return await this.userService.getByEmailOrThrow(email);
  }

  async create({
    createDto,
    createdById,
  }: {
    createDto: CreateUserDto;
    createdById: UUID;
  }): Promise<UserResponseDto> {
    const user = await this.createService.create({
      createDto,
      createdById,
    });

    await this.setUserCache(user);

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
      await Promise.all([
        this.cacheService.invalidateById({ id, alias: USER_QUERY_ALIAS }),
        this.cacheService.invalidateByKeyPattern(this.setEmailCacheKeyPrefix),
      ]);
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
      await this.cacheService.invalidateById({ id, alias: USER_QUERY_ALIAS });
    }

    return deleted;
  }

  private async setUserCache(user: GetUserDto): Promise<void> {
    await Promise.all([
      this.cacheService.set<GetUserDto>({
        key: this.cacheService.getIdKeyPrefixByAlias({
          id: user.id,
          alias: USER_QUERY_ALIAS,
        }),
        value: user,
      }),
      this.cacheService.set<GetUserDto>({
        key: this.setEmailCacheKeyPrefix + user.email,
        value: user,
      }),
    ]);
  }
}
