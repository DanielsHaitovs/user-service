import { CreateUserDto, UserResponseDto } from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userService/user/helper.service.';
import { Injectable } from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { UUID } from 'crypto';
import { DataSource } from 'typeorm';

@Injectable()
export class CreateService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userHelper: UserHelperService,
  ) {}

  /**
   * Creates a new user with the provided details and assigns the creator.
   * Password is hashed before saving to the database.
   *
   * @param createDto - The details of the user to create, including name, email, password, etc.
   * @param createdById - The ID of the user creating this new user
   * @returns The created User entity
   * @throws Error if the creator user is not found
   */
  async create({
    createDto,
    createdById,
  }: {
    createDto: CreateUserDto;
    createdById: UUID;
  }): Promise<UserResponseDto> {
    await this.userHelper.validateIfExists({ id: createdById });

    createDto.password = await bcrypt.hash(createDto.password, 10);

    return this.dataSource.transaction(async (manager) => {
      const newUser = manager.create(User, createDto);

      newUser.createdBy = {
        id: createdById,
      } as User;

      // TO DO: Handle department and role assignments here if needed

      return await manager.save(User, newUser);
    });
  }
}
