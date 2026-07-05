import { CacheService } from '@/baseServices/cache.service';
import { UserAction } from '@/common/enum/action.enum';
import { USER_QUERY_ALIAS } from '@/commonConst/user.const';
import { ClientMetadata } from '@/commonDecorators/meta.decorator';
import { AuditProducerService } from '@/user/services/audit.service';
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
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

import { FullUser } from '../common/pipes/full-user.pipe';

@Injectable()
export class UserPipelineService {
  constructor(
    private readonly userService: UserService,
    private readonly createService: CreateService,
    private readonly updateService: UpdateService,
    private readonly deleteService: DeleteService,
    private readonly cacheService: CacheService,
    private readonly audiService: AuditProducerService,
  ) {}

  async getMany(data: UserQueryRequest): Promise<UserListResponseDto> {
    return await this.userService.getMany(data);
  }

  async getByIdOrThrow({ id }: { id: UUID }): Promise<GetUserDto> {
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
        const user = await this.userService.getByIdOrThrow(id);

        await this.cacheService.set<GetUserDto>({
          key: cacheKey,
          value: user,
        });

        return user;
      },
    });
  }

  async getByEmailOrThrow({ email }: { email: string }): Promise<GetUserDto> {
    const cached = await this.cacheService.getById<GetUserDto>({
      id: email,
      alias: USER_QUERY_ALIAS,
    });

    if (cached) {
      return cached;
    }

    const cacheKey = this.cacheService.getIdKeyPrefixByAlias({
      id: email,
      alias: USER_QUERY_ALIAS,
    });

    return await this.cacheService.coalesce<GetUserDto>({
      key: cacheKey,
      operation: async () => {
        const user = await this.userService.getByEmailOrThrow(email);

        await this.cacheService.set<GetUserDto>({
          key: cacheKey,
          value: user,
        });

        return user;
      },
    });
  }

  async create({
    createDto,
    createdById,
    metadata,
  }: {
    createDto: CreateUserDto;
    createdById: UUID;
    metadata: ClientMetadata;
  }): Promise<UserResponseDto> {
    const user = await this.createService.create({
      createDto,
      createdById,
    });

    const { createdAt } = user;

    const promises: Promise<void>[] = [
      this.invalidateUserCache({}),
      this.setUserCache(user),
      this.audiService.sendLog({
        createdAt,
        userId: createdById,
        action: UserAction.CREATE,
        details: `User ${user.email} created`,
        targetUserId: user.id,
        oldState: null,
        newState: { [user.id]: user },
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      }),
    ];

    if (user.userRoles != undefined && user.userRoles.length > 0) {
      promises.push(
        this.audiService.sendRoleLog({
          createdAt,
          userId: createdById,
          action: UserAction.ASSIGN_ROLE,
          oldState: null,
          details: `User ${user.email} created with roles`,
          newState: user.userRoles,
          targetUserId: user.id,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }),
      );
    }

    if (user.userStores != undefined && user.userStores.length > 0) {
      promises.push(
        this.audiService.sendStoreLog({
          createdAt,
          userId: createdById,
          action: UserAction.ASSIGN_STORE,
          oldState: null,
          details: `User ${user.email} created with stores`,
          newState: user.userStores,
          targetUserId: user.id,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }),
      );
    }

    await Promise.all(promises);

    return user;
  }

  async update({
    user,
    data,
    requestedById,
    metadata,
  }: {
    user: GetUserDto;
    data: UpdateUserDto;
    requestedById: UUID;
    metadata: ClientMetadata;
  }): Promise<boolean> {
    const updated = await this.updateService.update({ user, data });

    if (updated) {
      await Promise.all([
        this.invalidateUserCache({ id: user.id, email: user.email }),
        this.audiService.sendLog({
          createdAt: new Date(),
          userId: requestedById,
          action: UserAction.UPDATE,
          details: `User ${user.email} updated`,
          targetUserId: user.id,
          oldState: user,
          // eslint-disable-next-line @typescript-eslint/no-misused-spread
          newState: { ...user, ...data },
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }),
      ]);
    }

    return updated;
  }

  async delete({
    data,
    canRemoveFromRelatedRoles,
    canRemoveFromRelatedStores,
    requestedById,
    metadata,
  }: {
    data: FullUser;
    canRemoveFromRelatedRoles: boolean;
    canRemoveFromRelatedStores: boolean;
    requestedById: UUID;
    metadata: ClientMetadata;
  }): Promise<boolean> {
    const deleted = await this.deleteService.delete({
      data,
      canRemoveFromRelatedRoles,
      canRemoveFromRelatedStores,
    });

    const { user } = data;

    if (deleted) {
      await Promise.all([
        this.invalidateUserCache({ id: user.id, email: user.email }),
        this.audiService.sendLog({
          createdAt: new Date(),
          userId: requestedById,
          action: UserAction.DELETE,
          details: `User ${user.email} deleted`,
          targetUserId: user.id,
          oldState: user,
          newState: null,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        }),
      ]);
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
        key: this.cacheService.getIdKeyPrefixByAlias({
          id: user.email,
          alias: USER_QUERY_ALIAS,
        }),
        value: user,
      }),
    ]);
  }

  private async invalidateUserCache({
    id,
    email,
  }: {
    id?: UUID;
    email?: string;
  }): Promise<void> {
    const promises: Promise<void>[] = [
      this.cacheService.invalidateByTags({
        tag: { purge: true },
        alias: USER_QUERY_ALIAS,
      }),
    ];

    if (id != undefined) {
      promises.push(
        this.cacheService.invalidateById({
          id,
          alias: USER_QUERY_ALIAS,
        }),
      );
    }

    if (email != undefined) {
      promises.push(
        this.cacheService.invalidateById({
          id: email,
          alias: USER_QUERY_ALIAS,
        }),
      );
    }

    await Promise.all(promises);
  }
}
