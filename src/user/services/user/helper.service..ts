import { UserResponseDto } from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { EntityManager } from 'typeorm';

@Injectable()
export class UserHelperService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * Validates if a user exists based on the provided ID or email.
   * At least one of the parameters (id or email) must be provided for validation.
   *
   * @param id - The UUID of the user to validate (optional).
   * @param email - The email of the user to validate (optional).
   * @returns The UserResponseDto of the found user.
   * @throws UnprocessableEntityException if neither id nor email is provided, or if no user is found with the given criteria.
   */
  async validateIfExists({
    id,
    email,
  }: {
    id?: UUID;
    email?: string;
  }): Promise<UserResponseDto> {
    if (id == undefined && email == undefined) {
      throw new UnprocessableEntityException(
        'Failed to validate if user exists: At least one of id or email must be provided for validation',
      );
    }

    return await this.entityManager.findOneOrFail(User, {
      where: {
        ...(id != undefined && { id }),
        ...(email != undefined && { email }),
      },
    });
  }
}
