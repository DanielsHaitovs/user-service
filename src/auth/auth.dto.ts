import {
  EXAMPLE_USER_EMAIL,
  SYSTEM_USER_PASSWORD,
} from '@/lib/const/user.const';
import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsString } from 'class-validator';

export class AuthenticateDto {
  @ApiProperty({
    description: 'The email of the user',
    example: EXAMPLE_USER_EMAIL,
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: SYSTEM_USER_PASSWORD,
    required: true,
  })
  @IsString()
  password: string;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}

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
