/* eslint-disable sonarjs/todo-tag */
import { updatedResults } from '@/base/helper/update';
import { SystemIdentityService } from '@/system/identity.service';
import { UpdateUserDto } from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userServices/helper.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class UpdateService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userHelperService: UserHelperService,
    private readonly systemIdentityService: SystemIdentityService,
  ) {}

  /**
   * Updates the details of a user.
   *
   * @param userId - The ID of the user to be updated.
   * @param data - An object containing the fields to be updated for the user.
   * @returns A boolean indicating whether the update was successful (i.e., if any records were affected).
   * @throws NotFoundException if the user with the specified ID does not exist.
   */
  async update({
    id,
    data,
  }: {
    id: UUID;
    data: UpdateUserDto;
  }): Promise<boolean> {
    await this.userHelperService.checkIfExists({ id });

    if (id === this.systemIdentityService.getSystemUserId()) {
      throw new UnauthorizedException(
        `You cannot update the system identity user.`,
      );
    }

    if (data.email != undefined) {
      await this.userHelperService.isEmailUniqueOrThrow({
        email: data.email,
        id,
      });
    }

    const updated = await this.userRepository.update(id, data);

    return updatedResults(updated);
  }
}
