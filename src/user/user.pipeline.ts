import { UserQueryRequest } from '@/userDto/query.dto';
import {
  CreateUserDto,
  GetUserDto,
  UpdateUserDto,
  UserListResponseDto,
  UserResponseDto,
} from '@/userDto/user.dto';
import { CreateService } from '@/userServices/create.service';
import { UpdateService } from '@/userServices/update.service';
import { UserService } from '@/userServices/user.service';
import { Injectable } from '@nestjs/common';

import { UUID } from 'crypto';

import { DeleteService } from './services/user/delete.service';

@Injectable()
export class UserPipelineService {
  constructor(
    private readonly userService: UserService,
    private readonly createService: CreateService,
    private readonly updateService: UpdateService,
    private readonly deleteService: DeleteService,
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

  async update({
    userId,
    data,
  }: {
    userId: UUID;
    data: UpdateUserDto;
  }): Promise<boolean> {
    return await this.updateService.update({ userId, data });
  }

  async delete({
    id,
    canRemoveFromRelatedRoles,
    canRemoveFromRelatedStores,
  }: {
    id: UUID;
    canRemoveFromRelatedRoles: boolean;
    canRemoveFromRelatedStores: boolean;
  }): Promise<boolean> {
    return await this.deleteService.delete({
      id,
      canRemoveFromRelatedRoles,
      canRemoveFromRelatedStores,
    });
  }
}
