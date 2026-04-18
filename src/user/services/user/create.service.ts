import { Roles } from '@/roleEntities/role.entity';
import { RoleHelperService } from '@/roleServices/helper.service';
import { Store } from '@/storeEntities/store.entity';
import { StoreHelperService } from '@/storeServices/helper.service';
import {
  CreateUserDto,
  GetCreatedByDto,
  UserResponseDto,
} from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { UserStores } from '@/userEntities/userStores.entity';
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
    private readonly roleHelper: RoleHelperService,
    private readonly storeHelper: StoreHelperService,
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
    await this.userHelper.throwIfExists([createDto.email]);
    await this.userHelper.validateIfExists({ id: createdById });

    createDto.password = await bcrypt.hash(createDto.password, 10);

    return this.dataSource.transaction(async (manager) => {
      const payload = manager.create(User, createDto);
      const { roleIds, storeIds } = createDto;

      payload.createdBy = {
        id: createdById,
      } as User;

      const newUser: UserResponseDto = await manager.save(User, payload);

      if (roleIds.length > 0) {
        await this.roleHelper.validateIfExist(roleIds);
      }

      if (storeIds.length > 0) {
        await this.storeHelper.validateStoresExists(storeIds);
      }

      newUser.createdBy = { id: createdById } as GetCreatedByDto;

      const userRoles = await manager.save(
        UserRoles,
        roleIds.map((roleId) => ({
          user: { id: newUser.id } as User,
          role: { id: roleId } as Roles,
          assignedBy: { id: createdById } as User,
        })),
      );

      newUser.userRoles = userRoles.map(({ role, assignedBy }) => ({
        role,
        assignedBy,
      }));

      const userStores = await manager.save(
        UserStores,
        storeIds.map((storeId) => ({
          store: { id: storeId } as Store,
          assignedBy: { id: createdById } as User,
        })),
      );

      newUser.userStores = userStores.map(({ store, assignedBy }) => ({
        store,
        assignedBy,
      }));

      return newUser;
    });
  }
}
