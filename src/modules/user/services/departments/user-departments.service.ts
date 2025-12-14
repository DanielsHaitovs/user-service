import { DepartmentHelperService } from '@/departmentHelper/helper.service';
import {
  DEPARTMENT_QUERY_ALIAS,
  USER_DEPARTMENTS_QUERY_ALIAS,
} from '@/libConst/department.const';
import { USER_QUERY_ALIAS } from '@/libConst/user.const';
import {
  AssignDepartmentsDto,
  UnAssignDepartmentsDto,
  UserDepartmentListResponseDto,
} from '@/userDto/departments.dto';
import { UnassignFromUserResponseDto } from '@/userDto/user.dto';
import { UserDepartments } from '@/userEntities/userDepartments.entity';
import { UserHelperService } from '@/userHelper/helper.service';
import { GetUserDepartmentByIdsRequestDto } from '@/userQueryDto/departments.dto';
import { QueryService } from '@/userService/query.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EntityNotFoundError, Repository } from 'typeorm';

@Injectable()
export class UserDepartmentsService {
  constructor(
    @InjectRepository(UserDepartments)
    private readonly userDepartmentRepository: Repository<UserDepartments>,
    private readonly queryService: QueryService,
    private readonly userService: UserHelperService,
    private readonly departmentService: DepartmentHelperService,
  ) {}

  async getUserDepartments(
    filters: GetUserDepartmentByIdsRequestDto,
  ): Promise<UserDepartmentListResponseDto> {
    const query = this.queryService.initQuery<UserDepartments>({
      entity: UserDepartments,
      alias: USER_DEPARTMENTS_QUERY_ALIAS,
    });

    const { page, limit, ids, departmentIds, userId } = filters;

    this.queryService.joinEntityRelation<UserDepartments>({
      query,
      relationAlias: USER_QUERY_ALIAS,
      shouldJoin: true,
      condition: 'AND',
      ...(userId != undefined && {
        options: {
          filters: {
            id: [userId],
          },
        },
      }),
    });

    this.queryService.joinEntityRelation<UserDepartments>({
      query,
      relationAlias: DEPARTMENT_QUERY_ALIAS,
      shouldJoin: true,
      condition: 'AND',
      options: {
        filters: {
          id: departmentIds,
        },
      },
    });

    this.queryService.whereIn({
      query,
      field: 'id',
      values: ids,
      condition: 'AND',
    });

    this.queryService.optimize({
      query,
      pagination: { limit, page },
      sort: undefined,
      select: [],
      criteria: this.queryService.userQueryCriteria({
        hasAccessToDepartments: true,
        includeDepartments: true,
        includeCreatedBy: false,
        includeRoles: false,
        includePermissions: false,
        hasAccessToCreatedBy: false,
        hasAccessToRoles: false,
        hasAccessToPermissions: false,
      }),
    });

    const response = await this.queryService.paginatedResult({
      query,
      alias: 'userDepartments',
    });

    if (response.userDepartments.length === 0) {
      throw new EntityNotFoundError(
        'Users Departments',
        'Provided criteria resulted in no entities found',
      );
    }

    return response;
  }

  /**
   * Assigns multiple departments to a user.
   *
   * @param userId - The ID of the user to whom departments will be assigned.
   * @param departmentIds - An array of department IDs to assign to the user.
   * @returns A promise resolving to the updated User entity with assigned departments.
   */
  async assignDepartmentsToUser(
    data: AssignDepartmentsDto,
  ): Promise<UserDepartments[]> {
    const { userId, departmentIds, assignedBy } = data;

    const user = await this.userService.findByIdOrFail({
      id: userId,
      includeRoles: true,
      includeDepartments: false,
    });

    const assignedByUser = await this.userService.findByIdOrFail({
      id: assignedBy,
      includeDepartments: false,
      includeRoles: false,
    });

    const departments =
      await this.departmentService.getManyByIdsOrFail(departmentIds);

    const userDepartments = departments.map((department) => {
      return this.userDepartmentRepository.create({
        users: user,
        departments: department,
        assignedBy: assignedByUser,
      });
    });

    return await this.userDepartmentRepository.save(userDepartments);
  }

  /**
   * Unassigns multiple departments from a user.
   *
   * @param userId - The ID of the user from whom departments will be unassigned.
   * @param departmentIds - An array of department IDs to unassign from the user.
   * @returns A promise resolving to the updated User entity without the unassigned departments.
   */
  async unassignDepartmentsFromUser(
    data: UnAssignDepartmentsDto,
  ): Promise<UnassignFromUserResponseDto> {
    const { userIds, departmentIds } = data;

    await this.userService.findManyByIdsOrFail(userIds);
    await this.departmentService.getManyByIdsOrFail(departmentIds);

    const result = await this.userDepartmentRepository
      .createQueryBuilder()
      .delete()
      .from(UserDepartments)
      .where('department.id IN (:...departmentIds)', { departmentIds })
      .andWhere('user.id IN (:...userIds)', { userIds })
      .execute();

    return {
      unassigned: result.affected ?? 0,
      status: 'Departments unassigned successfully',
    };
  }
}
