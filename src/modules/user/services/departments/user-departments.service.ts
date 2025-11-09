import { User } from '@/user/entities/user.entity';
import { HelperService } from '@/user/helper/helper.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class UserDepartmentsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly helperService: HelperService,
  ) {}

  /**
   * Assigns multiple departments to a user.
   *
   * @param userId - The ID of the user to whom departments will be assigned.
   * @param departmentIds - An array of department IDs to assign to the user.
   * @returns A promise resolving to the updated User entity with assigned departments.
   */
  async assignDepartmentsToUser({
    userId,
    departmentIds,
  }: {
    userId: UUID;
    departmentIds: UUID[];
  }): Promise<User> {
    const user = await this.helperService.findByIdOrFail({
      id: userId,
      includeDepartments: true,
      includeRoles: false,
    });

    departmentIds = departmentIds.filter(
      (id) => !user.departments.some((dept) => dept.id === id),
    );

    if (departmentIds.length === 0) {
      return user;
    }

    const department =
      await this.helperService.findManyDeaprtmentsOrFail(departmentIds);

    user.departments.push(...department);
    await this.userRepository.save(user);

    return user;
  }

  /**
   * Unassigns multiple departments from a user.
   *
   * @param userId - The ID of the user from whom departments will be unassigned.
   * @param departmentIds - An array of department IDs to unassign from the user.
   * @returns A promise resolving to the updated User entity without the unassigned departments.
   */
  async unassignDepartmentsFromUser({
    userId,
    departmentIds,
  }: {
    userId: UUID;
    departmentIds: UUID[];
  }): Promise<User> {
    const user = await this.helperService.findByIdOrFail({
      id: userId,
      includeDepartments: true,
      includeRoles: false,
    });

    await this.helperService.findManyDeaprtmentsOrFail(departmentIds);

    user.departments = user.departments.filter(
      (dept) => !departmentIds.includes(dept.id),
    );

    await this.userRepository.save(user);

    return user;
  }
}
