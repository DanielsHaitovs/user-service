import { EntityQueryService } from '@/base/service/query.service';
import { HelperService as DepartmentHelperService } from '@/department/services/helper.service';
import { DEPARTMENT_QUERY_ALIAS } from '@/lib/const/department.const';
import { ROLE_QUERY_ALIAS } from '@/lib/const/role.const';
import {
  USER_QUERY_ALIAS,
  USER_ROLE_QUERY_ALIAS,
} from '@/lib/const/user.const';
import { Roles } from '@/role/entities/role.entity';
import { HelperService as RoleHelperService } from '@/role/services/role/helper.service';
import { User } from '@/user/entities/user.entity';
import { UserRole } from '@/user/entities/userRoles.entity';
import { ConflictException, Injectable } from '@nestjs/common';

import { UUID } from 'crypto';
import { EntityManager, EntityNotFoundError } from 'typeorm';

@Injectable()
export class HelperService extends EntityQueryService {
  constructor(
    private readonly departmentsService: DepartmentHelperService,
    private readonly roleService: RoleHelperService,
    protected userEntity: EntityManager,
  ) {
    super(userEntity);
  }

  async createUser({
    user,
    departmentIds,
    roleIds,
    createdById,
  }: {
    user: User;
    departmentIds?: UUID[] | undefined;
    roleIds?: UUID[] | undefined;
    createdById: UUID;
  }): Promise<User> {
    const createdBy = await this.findByIdOrFail({ id: createdById });

    user.createdBy = createdBy;

    if (departmentIds != undefined && departmentIds.length > 0) {
      const departments =
        await this.departmentsService.getManyByIdsOrFail(departmentIds);

      user.departments = departments;
    }

    if (roleIds == undefined || roleIds.length === 0) {
      await this.roleService.getManyByIdsOrFail(roleIds);
    }

    return this.userEntity.transaction(async (manager) => {
      const newUser = await manager.save(User, user);

      if (roleIds == undefined || roleIds.length === 0) {
        return newUser;
      }

      const userRoles = roleIds.map((roleId) => {
        return manager.create(UserRole, {
          role: { id: roleId } as Roles,
          user: { id: newUser.id } as User,
          assignedBy: { id: createdBy.id } as User,
        });
      });

      const assignedRoles = await manager.save(UserRole, userRoles);

      newUser.userRoles = assignedRoles.map(
        ({ user: _omit, ...rest }) => rest as UserRole,
      );

      return newUser;
    });
  }

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

    if (includeDepartments === true) {
      this.joinRelation<User>({
        query,
        relationAlias: DEPARTMENT_QUERY_ALIAS,
      });
    }

    if (includeRoles === true) {
      this.joinRelation<User>({
        query,
        relationAlias: USER_ROLE_QUERY_ALIAS,
      });

      this.joinRelation<User>({
        query,
        relationAlias: ROLE_QUERY_ALIAS,
        nestedRelation: {
          [USER_ROLE_QUERY_ALIAS]: {
            nestedFrom: USER_ROLE_QUERY_ALIAS,
            hasAccess: true,
            includeAll: false,
          },
        },
      });
    }
    this.whereIn<User>({ query, field: 'id', values: [id], condition: 'AND' });

    return await query.getOneOrFail();
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

  async findManyByIdsOrFail(ids: UUID[]): Promise<void> {
    const existingUsers = await this.entityManager
      .createQueryBuilder(User, USER_QUERY_ALIAS)
      .where(`${USER_QUERY_ALIAS}.id IN (:...ids)`, { ids })
      .getMany();

    if (existingUsers.length !== ids.length) {
      const existingIds = existingUsers.map((role) => role.id);
      const missingIds = ids.filter((userId) => !existingIds.includes(userId));
      throw new EntityNotFoundError(
        'User',
        `Users with IDs [${missingIds.join(', ')}] not found.`,
      );
    }
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
