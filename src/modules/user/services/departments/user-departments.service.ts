import { DepartmentHelperService } from '@/department/helper/helper.service';
import {
  AssignDepartmentsDto,
  UnAssignDepartmentsDto,
} from '@/user/dto/departments.dto';
import { UserDepartments } from '@/user/entities/userDepartments.entity';
import { UserHelperService } from '@/user/helper/helper.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

@Injectable()
export class UserDepartmentsService {
  constructor(
    @InjectRepository(UserDepartments)
    private readonly userDepartmentRepository: Repository<UserDepartments>,
    private readonly userService: UserHelperService,
    private readonly departmentService: DepartmentHelperService,
  ) {}

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
        user,
        department,
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
  ): Promise<{ unassigned: number; status: string }> {
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
