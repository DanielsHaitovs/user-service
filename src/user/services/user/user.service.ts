import { EntityQueryService } from '@/base/service/query.service';
import { USER_QUERY_ALIAS } from '@/lib/const/user.const';
import { UserQueryRequest } from '@/userDto/query.dto';
import { GetUserDto, UserListResponseDto } from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly queryService: EntityQueryService,
  ) {}

  /**
   * Retrieves a list of users based on the provided query parameters, including pagination, sorting, and filtering options.
   * @param data - An object containing the query parameters for retrieving users, such as IDs, names, emails, active status, pagination details, sorting options, and date filters.
   * @returns A promise that resolves to a UserListResponseDto containing the paginated list of users matching the query criteria.
   */
  async getMany(data: UserQueryRequest): Promise<UserListResponseDto> {
    const {
      ids,
      firstNames,
      emails,
      isActive,
      page,
      limit,
      sortField,
      sortOrder,
      dateFilterParam,
      dateFrom,
      dateTo,
    } = data;

    const query = this.queryService.initQuery<User>({
      entity: User,
      alias: USER_QUERY_ALIAS,
    });

    this.queryService.whereIn<User>({
      query,
      field: 'id',
      condition: 'AND',
      values: ids,
    });

    this.queryService.whereIn<User>({
      query,
      field: 'firstName',
      condition: 'AND',
      values: firstNames,
    });

    this.queryService.whereIn<User>({
      query,
      field: 'email',
      condition: 'AND',
      values: emails,
    });

    this.queryService.where<User>({
      query,
      field: 'isActive',
      condition: 'AND',
      value: isActive,
    });

    if (dateFilterParam != undefined) {
      this.queryService.dateGreaterThan<User>({
        query,
        field: dateFilterParam,
        condition: 'AND',
        date: dateFrom,
      });
      this.queryService.dateLessThan<User>({
        query,
        field: dateFilterParam,
        condition: 'AND',
        date: dateTo,
      });
    }

    this.queryService.sort<User>({
      query,
      sort: {
        sortField,
        sortOrder,
      },
    });

    this.queryService.paginate<User>({
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
   * Get user by id or throw an error if not found
   * @param id - User id
   * @throws EntityNotFoundException if user is not found
   * @returns User data transfer object
   */
  async getByIdOrThrow(id: UUID): Promise<GetUserDto> {
    return await this.userRepository.findOneByOrFail({ id });
  }

  /**
   * Get user by email or throw an error if not found
   * @param email - User email
   * @throws EntityNotFoundException if user is not found
   * @returns User data transfer object
   */
  async getByEmailOrThrow(email: string): Promise<GetUserDto> {
    return await this.userRepository.findOneByOrFail({ email });
  }
}
