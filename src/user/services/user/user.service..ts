import { UserResponseDto } from '@/userDto/user.dto';
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

  async getByIdOrThrow(id: UUID): Promise<UserResponseDto> {
    return await this.userRepository.findOneByOrFail({ id });
  }

  async getByEmailOrThrow(email: string): Promise<UserResponseDto> {
    return await this.userRepository.findOneByOrFail({ email });
  }
}
