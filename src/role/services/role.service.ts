import { EntityQueryService } from '@/baseServices/query.service';
import { ROLE_QUERY_ALIAS } from '@/lib/const/role.const';
import { RolesQueryRequest } from '@/roleDto/query.dto';
import { GetRoleDto, RoleListResponseDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    private readonly queryService: EntityQueryService,
  ) {}

  /**
   * Retrieves a list of roles based on the provided query parameters, including pagination, sorting, and filtering options.
   * @param data - An object containing the query parameters for retrieving roles, such as IDs, names, pagination details, sorting options, and date filters.
   * @returns A promise that resolves to a RoleListResponseDto containing the paginated list of roles matching the query criteria.
   */
  async getMany(data: RolesQueryRequest): Promise<RoleListResponseDto> {
    const {
      ids,
      names,
      page,
      limit,
      sortField,
      sortOrder,
      dateFilterParam,
      dateFrom,
      dateTo,
    } = data;

    const query = this.queryService.initQuery<Roles>({
      entity: Roles,
      alias: ROLE_QUERY_ALIAS,
    });

    this.queryService.whereIn<Roles>({
      query,
      field: 'name',
      condition: 'AND',
      values: names,
    });

    this.queryService.whereIn<Roles>({
      query,
      field: 'id',
      condition: 'AND',
      values: ids,
    });

    if (dateFilterParam != undefined) {
      this.queryService.dateGreaterThan<Roles>({
        query,
        field: dateFilterParam,
        condition: 'AND',
        date: dateFrom,
      });
      this.queryService.dateLessThan<Roles>({
        query,
        field: dateFilterParam,
        condition: 'AND',
        date: dateTo,
      });
    }

    this.queryService.sort<Roles>({
      query,
      sort: {
        sortField,
        sortOrder,
      },
    });

    this.queryService.paginate<Roles>({
      query,
      pagination: {
        page,
        limit,
      },
    });

    return await this.queryService.paginatedResult({
      query,
    });
  }

  /**
   * Retrieves a role by its ID or throws an exception if not found.
   * @param id - The UUID of the role to retrieve.
   * @returns A promise that resolves to the GetRoleDto of the found role.
   * @throws EntityNotFoundException if no role with the given ID is found.
   */
  async getByIdOrThrow(id: UUID): Promise<GetRoleDto> {
    return await this.roleRepository.findOneByOrFail({ id });
  }

  /**
   * Retrieves a role by its name or throws an exception if not found.
   * @param name - The name of the role to retrieve.
   * @returns A promise that resolves to the GetRoleDto of the found role.
   * @throws EntityNotFoundException if no role with the given name is found.
   */
  async getByNameOrThrow(name: string): Promise<GetRoleDto> {
    return await this.roleRepository.findOneByOrFail({ name });
  }
}
