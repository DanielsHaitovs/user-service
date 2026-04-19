import { EntityQueryService } from '@/base/service/query.service';
import { GetRelatedRoleDto } from '@/roleDto/role.dto';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class UserRoleHelperService {
  constructor(
    @InjectRepository(UserRoles)
    private readonly roleRepository: Repository<UserRoles>,
    private readonly queryService: EntityQueryService,
  ) {}

  /**
   * Retrieves the roles assigned to a user by their unique identifier.
   *
   * @param userId - The unique identifier of the user (UUID).
   * @returns A promise that resolves to an array of GetRelatedRoleDto objects representing the user's roles.
   */
  async getAssignedRoles(userId: UUID): Promise<GetRelatedRoleDto[]> {
    const query = this.roleRepository
      .createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('userRole.user', 'user')
      .where('user.id = :userId', { userId })
      .select([
        'userRole.id',
        'role.id',
        'role.name',
        'role.createdAt',
        'role.updatedAt',
      ]);

    const userRoles = await this.queryService.getAll<UserRoles>({
      query,
      cache: true,
    });

    return userRoles.map((userRole) => ({
      id: userRole.role.id,
      name: userRole.role.name,
      createdAt: userRole.role.createdAt,
      updatedAt: userRole.role.updatedAt,
    }));
  }
}
