import { EntityQueryService } from '@/baseServices/query.service';
import { DepartmentResponseDto } from '@/departmentDto/department.dto';
import { Departments } from '@/departmentEntities/department.entity';
import { DEPARTMENT_QUERY_ALIAS } from '@/libConst/department.const';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { UUID } from 'crypto';
import { EntityNotFoundError } from 'typeorm';

@Injectable()
export class DepartmentHelperService extends EntityQueryService {
  /** Checks for name conflicts when creating or updating a department.
   *
   * @param id - Optional UUID of the department being updated
   * @param name - Name of the department to check for conflicts
   * @returns Promise resolving to void
   * @throws ConflictException when a department with the same name already exists
   */
  async findNameConflicts({
    id,
    name,
  }: {
    id?: UUID;
    name: string;
  }): Promise<void> {
    const query = this.entityManager
      .createQueryBuilder(Departments, DEPARTMENT_QUERY_ALIAS)
      .where(`${DEPARTMENT_QUERY_ALIAS}.name = :name`, { name });

    if (id !== undefined) {
      query.andWhere(`${DEPARTMENT_QUERY_ALIAS}.id != :id`, { id });
    }

    const department = await query.getOne();

    if (department != undefined) {
      throw new ConflictException(
        `Departments with name "${name}" already exists. Please choose a different name.`,
      );
    }
  }

  /**
   * Retrieves a department by its ID.
   *
   * @param id - UUID of the department to retrieve
   * @returns Promise resolving to the Departments entity
   * @throws EntityNotFoundError when the department ID doesn't exist
   */
  async getByIdOrFail(id: UUID): Promise<DepartmentResponseDto> {
    return await this.entityManager
      .createQueryBuilder(Departments, DEPARTMENT_QUERY_ALIAS)
      .where(`${DEPARTMENT_QUERY_ALIAS}.id = :id`, { id })
      .getOneOrFail();
  }

  /**
   * Retrieves departments by their IDs.
   *
   * @param ids - UUIDs of the departments to retrieve
   * @returns Promise resolving to an array of Departments entities
   * @throws BadRequestException when not all provided department IDs exist
   */
  async getManyByIdsOrFail(departmentIds?: UUID[]): Promise<Departments[]> {
    if (departmentIds == undefined || departmentIds.length === 0) {
      throw new BadRequestException('No department ids provided');
    }

    const query = this.initQuery({
      entity: Departments,
      alias: DEPARTMENT_QUERY_ALIAS,
    });

    this.whereIn({
      query,
      field: 'id',
      values: departmentIds,
      condition: 'AND',
      relationAlias: DEPARTMENT_QUERY_ALIAS,
    });

    this.cacheQuery<Departments>({
      query,
      expireAtMs: 300000,
    });

    const departments = await query.getMany();

    if (departments.length !== departmentIds.length) {
      const existingIds = departments.map((department) => department.id);
      const missingIds = departmentIds.filter(
        (departmentId) => !existingIds.includes(departmentId),
      );

      throw new EntityNotFoundError(
        'Departments',
        `Departments with IDs [${missingIds.join(', ')}] not found.`,
      );
    }

    return departments;
  }
}
