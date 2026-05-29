import { AuthenticateDto } from '@/auth/auth.dto';
import {
  EXAMPLE_TWO_FACTOR_SECRET,
  EXAMPLE_USER_ID,
  SYSTEM_USER_PASSWORD,
} from '@/libConst/user.const';
import { ApiProperty } from '@nestjs/swagger';

import { ToBoolean } from 'class-sanitizer';
import { IsString, IsUUID } from 'class-validator';

export class ResetPasswordDto extends AuthenticateDto {
  @ApiProperty({
    description: 'The new password for the user',
    example: SYSTEM_USER_PASSWORD,
    required: true,
  })
  @IsString()
  newPassword: string;

  constructor(email: string, password: string, newPassword: string) {
    super(email, password);
    this.newPassword = newPassword;
  }
}

export class ResetTwoFactorAuthenticationDto {
  @ApiProperty({
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'The new two-factor authentication secret for the user',
    example: EXAMPLE_TWO_FACTOR_SECRET,
    required: true,
  })
  @IsString()
  twoFactorSecret: string;

  constructor(userId: string, twoFactorSecret: string) {
    this.userId = userId;
    this.twoFactorSecret = twoFactorSecret;
  }
}

export class UpdateTwoFactorAuthenticationStatusDto {
  @ApiProperty({
    description: 'User unique identifier - must be a valid UUID',
    example: EXAMPLE_USER_ID,
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description:
      'Indicates whether two-factor authentication should be enabled or disabled for the user',
    example: true,
    required: true,
    type: Boolean,
  })
  @ToBoolean()
  isTwoFactorEnabled: boolean;

  constructor(userId: string, isTwoFactorEnabled: boolean) {
    this.userId = userId;
    this.isTwoFactorEnabled = isTwoFactorEnabled;
  }
}
