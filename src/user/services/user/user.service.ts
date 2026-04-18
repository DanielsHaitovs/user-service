import { GetUserDto } from '@/userDto/user.dto';
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
  ) {}

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
