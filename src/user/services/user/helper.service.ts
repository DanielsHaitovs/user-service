/* eslint-disable sonarjs/todo-tag */
import { GetUserDto } from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Not, Repository } from 'typeorm';

@Injectable()
export class UserHelperService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Validates if a user exists based on the provided ID or email.
   * At least one of the parameters (id or email) must be provided for validation.
   *
   * @param id - The UUID of the user to validate (optional).
   * @param email - The email of the user to validate (optional).
   * @returns void
   * @throws UnprocessableEntityException if neither id nor email is provided, or if no user is found with the given criteria.
   */
  async checkIfExists({
    id,
    email,
  }: {
    id?: UUID;
    email?: string;
  }): Promise<GetUserDto> {
    if (id == undefined && email == undefined) {
      throw new UnprocessableEntityException(
        'Failed to validate if user exists: At least one of id or email must be provided for validation',
      );
    }

    const user = await this.userRepository.findOne({
      where: {
        ...(id != undefined && { id }),
        ...(email != undefined && { email }),
      },
    });

    if (!user) {
      throw new UnprocessableEntityException(`User does not exist.`);
    }

    return user;
  }

  // TODO: it may be useful in other places. Consider reusing this other services instead of duplicating the logic or remove it if it's not needed

  /**
   * Retrieves a user by their email address. If no user is found, an exception is thrown. Be careful when using this method, as it will return private user information such as the password. Make sure to only use this method in contexts where it's necessary and secure to access such information.
   *
   * @param email - The email address of the user to retrieve.
   * @returns A promise that resolves to the GetUserDto of the found user.
   * @throws EntityNotFoundException if no user is found with the given email.
   */
  async getByEmail({ email }: { email: string }): Promise<User | null> {
    return await this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  /**
   * Checks if the provided email is unique among all users, excluding a specific user ID if provided. If a user with the same email exists (other than the excluded ID), an exception is thrown.
   *
   * @param email - The email address to check for uniqueness.
   * @param id - An optional user ID to exclude from the uniqueness check (useful when updating a user's email).
   * @returns void
   * @throws ConflictException if a user with the same email already exists (excluding the specified ID).
   */
  async isEmailUniqueOrThrow({
    email,
    id,
  }: {
    email: string;
    id?: UUID | undefined;
  }): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        email,
        ...(id != undefined && { id: Not(id) }),
      },
    });

    if (user) {
      throw new ConflictException(
        `Email "${email}" is already in use by another user.`,
      );
    }
  }
}
