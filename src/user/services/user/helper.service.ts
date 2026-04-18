import { User } from '@/userEntities/user.entity';
import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { In, Repository } from 'typeorm';

@Injectable()
export class UserHelperService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Validates that a user with the given email does not already exist.
   * @param emails - The email of the user to validate.
   * @throws ConflictException if a user with the given email already exists.
   */
  async throwIfExists(emails: string[]): Promise<void> {
    const existingUsers = await this.userRepository.find({
      where: {
        email: In(emails),
      },
    });

    if (existingUsers.length) {
      throw new ConflictException(
        `A user with the email(s) "${emails.join(', ')}" already exists.`,
      );
    }
  }

  /**
   * Validates if a user exists based on the provided ID or email.
   * At least one of the parameters (id or email) must be provided for validation.
   *
   * @param id - The UUID of the user to validate (optional).
   * @param email - The email of the user to validate (optional).
   * @returns void
   * @throws UnprocessableEntityException if neither id nor email is provided, or if no user is found with the given criteria.
   */
  async validateIfExists({
    id,
    email,
  }: {
    id?: UUID;
    email?: string;
  }): Promise<void> {
    if (id == undefined && email == undefined) {
      throw new UnprocessableEntityException(
        'Failed to validate if user exists: At least one of id or email must be provided for validation',
      );
    }

    await this.userRepository.findOneOrFail({
      where: {
        ...(id != undefined && { id }),
        ...(email != undefined && { email }),
      },
    });
  }
}
