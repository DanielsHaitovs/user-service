/* eslint-disable sonarjs/todo-tag */
import { updatedResults } from '@/base/update';
import { EnvConfigService } from '@/config/env/env.config.service';
import {
  ResetPasswordDto,
  ResetTwoFactorAuthenticationDto,
  UpdateTwoFactorAuthenticationStatusDto,
} from '@/userDto/auth.dto';
import { UpdateUserDto } from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userServices/helper.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { UUID } from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class UpdateService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly envConfigService: EnvConfigService,
    private readonly userHelperService: UserHelperService,
  ) {}

  // TODO: Refactor this method to use a more secure password reset flow, such as sending a password reset, reset expiry date, and reset token to the user's email, and then allowing the user to reset their password using the token. This will help prevent unauthorized password resets and improve overall security.
  /**
   * Resets the password for a user after verifying the current password.
   * If the current password is correct, updates the user's password and sets a new password reset token and expiry date.
   *
   * @param data - The details required to reset the password, including email, current password, and new password.
   * @returns void
   * @throws UnauthorizedException if the email is not found or the current password does not match.
   */
  async resetPassword(data: ResetPasswordDto): Promise<void> {
    const { email, password, newPassword } = data;

    const user = await this.userHelperService.getByEmail(email);

    if (!user) {
      throw new UnauthorizedException();
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException();
    }

    const resetExpiryDate = new Date();
    resetExpiryDate.setMonth(resetExpiryDate.getMonth() + 3);

    const encryptedPassword = await bcrypt.hash(
      newPassword,
      this.envConfigService.passwordSaltRounds,
    );

    await this.userRepository.update(user.id, {
      password: encryptedPassword,
    });
  }

  // TODO: Refactor this method to use a more secure password reset two-factory flow, such as sending a password reset, reset expiry date, and reset token to the user's email, and then allowing the user to reset their password using the token. This will help prevent unauthorized password resets and improve overall security.
  /**
   * Resets the two-factor authentication secret for a user.
   *
   * @param userId - The ID of the user whose two-factor authentication secret is to be reset.
   * @param twoFactorSecret - The new two-factor authentication secret to be set for the user.
   * @returns void
   */
  async resetTwoFactorAuthentication(
    data: ResetTwoFactorAuthenticationDto,
  ): Promise<void> {
    const { userId, twoFactorSecret } = data;

    await this.userRepository.update(userId, {
      twoFactorSecret,
    });
  }

  /**
   * Updates the two-factor authentication status for a user.
   *
   * @param userId - The ID of the user whose two-factor authentication status is to be updated.
   * @param isTwoFactorEnabled - A boolean indicating whether two-factor authentication should be enabled or disabled for the user.
   * @returns void
   */
  async updateTwoFactorAuthenticationStatus(
    data: UpdateTwoFactorAuthenticationStatusDto,
  ): Promise<void> {
    const { userId, isTwoFactorEnabled } = data;

    await this.userRepository.update(userId, {
      isTwoFactorEnabled,
    });
  }

  /**
   * Updates the details of a user.
   *
   * @param userId - The ID of the user to be updated.
   * @param data - An object containing the fields to be updated for the user.
   * @returns A boolean indicating whether the update was successful (i.e., if any records were affected).
   * @throws NotFoundException if the user with the specified ID does not exist.
   */
  async update({
    userId,
    data,
  }: {
    userId: UUID;
    data: UpdateUserDto;
  }): Promise<boolean> {
    await this.userHelperService.validateIfExists({ id: userId });

    if (data.email) {
      await this.userHelperService.isEmailUniqueOrThrow({
        email: data.email,
        userId,
      });
    }

    const updated = await this.userRepository.update(userId, data);

    return updatedResults(updated);
  }

  /**
   * Deactivates a user by setting their isActive status to false.
   *
   * @param userId - The ID of the user to be deactivated.
   * @returns A boolean indicating whether the deactivation was successful (i.e., if any records were affected).
   * @throws NotFoundException if the user with the specified ID does not exist.
   */
  async changeStatus({
    userId,
    isActive,
  }: {
    userId: UUID;
    isActive: boolean;
  }): Promise<boolean> {
    const user = await this.userHelperService.validateIfExists({ id: userId });

    if (user.isActive === isActive) {
      return true;
    }

    const updated = await this.userRepository.update(userId, {
      isActive,
    });

    return updatedResults(updated);
  }
}
