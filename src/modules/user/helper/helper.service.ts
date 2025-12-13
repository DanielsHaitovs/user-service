import { EntityQueryService } from '@/base/service/query.service';
import { USER_QUERY_ALIAS } from '@/lib/const/user.const';
import { User } from '@/user/entities/user.entity';
import { QueryService } from '@/user/services/query.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { UUID } from 'crypto';
import { EntityManager, EntityNotFoundError } from 'typeorm';

@Injectable()
export class UserHelperService extends EntityQueryService {
  constructor(
    protected userEntity: EntityManager,
    private readonly userQuery: QueryService,
  ) {
    super(userEntity);
  }

  /*
   * Finds a user by ID, with optional inclusion of related departments and roles
   */
  async findByIdOrFail({
    id,
    includeDepartments,
    includeRoles,
  }: {
    id: UUID;
    includeDepartments?: boolean;
    includeRoles?: boolean;
  }): Promise<User> {
    const query = this.initQuery<User>({
      entity: User,
      alias: USER_QUERY_ALIAS,
    });

    this.userQuery.filterByDepartments({
      query,
      hasAccessToDepartments: includeDepartments ?? false,
    });

    this.userQuery.filterByRolePermission({
      query,
      hasAccessToRoles: true,
      includeRoles: includeRoles ?? false,
      hasAccessToPermissions: false,
      includePermissions: false,
    });

    this.whereIn<User>({ query, field: 'id', values: [id], condition: 'AND' });

    return await query.getOneOrFail();
  }

  async findManyByIdsOrFail(ids?: UUID[]): Promise<User[]> {
    if (ids == undefined || ids.length === 0) {
      throw new BadRequestException('No user ids provided');
    }

    const query = this.initQuery({
      entity: User,
      alias: USER_QUERY_ALIAS,
    });

    this.whereIn({
      query,
      field: 'id',
      values: ids,
      condition: 'AND',
      relationAlias: USER_QUERY_ALIAS,
    });

    this.cacheQuery<User>({ query, expireAtMs: 300000 });

    const users = await query.getMany();

    if (users.length !== ids.length) {
      const existingIds = users.map((user) => user.id);
      const missingIds = ids.filter((userId) => !existingIds.includes(userId));

      throw new EntityNotFoundError(
        'Users',
        `Users with IDs [${missingIds.join(', ')}] not found.`,
      );
    }

    return users;
  }

  async findByEmailOrFail(email: string): Promise<User> {
    const query = this.initQuery<User>({
      entity: User,
      alias: USER_QUERY_ALIAS,
    });

    this.whereIn<User>({
      query,
      field: 'email',
      values: [email],
      condition: 'AND',
    });

    return await query.getOneOrFail();
  }

  async findEmailConflicts({
    id,
    email,
  }: {
    id?: UUID;
    email: string;
  }): Promise<void> {
    const query = this.entityManager
      .createQueryBuilder(User, USER_QUERY_ALIAS)
      .where(`${USER_QUERY_ALIAS}.email = :email`, { email });

    if (id !== undefined) {
      query.andWhere(`${USER_QUERY_ALIAS}.id != :id`, { id });
    }

    const user = await query.getOne();

    if (user != undefined) {
      throw new ConflictException(
        `User with email "${email}" already exists. Please choose a different email.`,
      );
    }
  }
}
