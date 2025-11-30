import { EntityQueryService } from '@/base/service/query.service';
import { Departments } from '@/department/entities/department.entity';
import { DepartmentHelperService } from '@/department/helper/helper.service';
import { USER_QUERY_ALIAS } from '@/lib/const/user.const';
import { Roles } from '@/role/entities/role.entity';
import { RoleHelperService } from '@/role/helper/helper.service';
import { User } from '@/user/entities/user.entity';
import { UserRole } from '@/user/entities/userRoles.entity';
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
    private readonly departmentsService: DepartmentHelperService,
    private readonly roleService: RoleHelperService,
    private readonly userQuery: QueryService,
  ) {
    super(userEntity);
  }

  /*
   * Creates a new user with optional department and role assignments
   */
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

    if (roleIds != undefined && roleIds.length > 0) {
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

    this.cacheQuery<User>({ query, expireAtMs: 30000 });

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

  async findManyDeaprtmentsOrFail(ids: UUID[]): Promise<Departments[]> {
    return await this.departmentsService.getManyByIdsOrFail(ids);
  }

  async findManyRolesOrFail(ids: UUID[]): Promise<Roles[]> {
    return await this.roleService.getManyByIdsOrFail(ids);
  }
}
