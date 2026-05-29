import {
  ResetPasswordDto,
  ResetTwoFactorAuthenticationDto,
  UpdateTwoFactorAuthenticationStatusDto,
} from '@/userDto/auth.dto';
import { UpdateService } from '@/userServices/update.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthPipelineService {
  constructor(private readonly updateService: UpdateService) {}

  async resetPassword(data: ResetPasswordDto): Promise<void> {
    await this.updateService.resetPassword(data);
  }

  async resetTwoFactorAuthentication(
    data: ResetTwoFactorAuthenticationDto,
  ): Promise<void> {
    await this.updateService.resetTwoFactorAuthentication(data);
  }

  async updateTwoFactorAuthenticationStatus(
    data: UpdateTwoFactorAuthenticationStatusDto,
  ): Promise<void> {
    await this.updateService.updateTwoFactorAuthenticationStatus(data);
  }
}
