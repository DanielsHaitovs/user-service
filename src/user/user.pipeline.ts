import { UserQueryRequest } from '@/userDto/query.dto';
import {
  CreateUserDto,
  GetUserDto,
  UserListResponseDto,
  UserResponseDto,
} from '@/userDto/user.dto';
import { CreateService } from '@/userServices/create.service';
import { UserService } from '@/userServices/user.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class UserPipelineService {
  constructor(
    private readonly userService: UserService,
    private readonly createService: CreateService,
  ) {}

  async getMany(data: UserQueryRequest): Promise<UserListResponseDto> {
    return await this.userService.getMany(data);
  }

  async getByIdOrThrow(id: UUID): Promise<GetUserDto> {
    return await this.userService.getByIdOrThrow(id);
  }

  async getByEmailOrThrow(email: string): Promise<GetUserDto> {
    return await this.userService.getByEmailOrThrow(email);
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
