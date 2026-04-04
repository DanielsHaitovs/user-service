import { CreateUserDto, UserResponseDto } from '@/userDto/user.dto';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

import { CreateService } from './services/user/create.service';
import { UserService } from './services/user/user.service.';

@Injectable()
export class UserPipelineService {
  constructor(
    private readonly userService: UserService,
    private readonly createService: CreateService,
  ) {}

  async getByIdOrThrow(id: UUID): Promise<UserResponseDto> {
    return await this.userService.getByIdOrThrow(id);
  }

  async create({
    createDto,
    createdById,
  }: {
    createDto: CreateUserDto;
    createdById: UUID;
  }): Promise<UserResponseDto> {
    return await this.createService.create({ createDto, createdById });
  }
}
