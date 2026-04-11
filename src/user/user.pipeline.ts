import { CreateUserDto, GetUserDto, UserResponseDto } from '@/userDto/user.dto';
import { UserRolesService } from '@/userService/role/role.service';
import { CreateService } from '@/userService/user/create.service';
import { UserService } from '@/userService/user/user.service.';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class UserPipelineService {
  constructor(
    private readonly userService: UserService,
    private readonly createService: CreateService,
    private readonly userRolesService: UserRolesService,
  ) {}

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
