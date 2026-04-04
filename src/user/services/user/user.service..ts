import { UserResponseDto } from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityManager } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async getByIdOrThrow(id: UUID): Promise<UserResponseDto> {
    return await this.entityManager.findOneByOrFail(User, { id });
  }
}
