import {
  SYSTEM_USER_EMAIL,
  SYSTEM_USER_PASSWORD,
} from '@/lib/const/user.const';
import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address - must be unique across the platform',
    example: SYSTEM_USER_EMAIL,
    format: 'email',
    maxLength: 255,
    type: String,
    uniqueItems: true,
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'User password - will be hashed before storage',
    example: SYSTEM_USER_PASSWORD,
    minLength: 8,
    maxLength: 255,
    type: String,
    writeOnly: true,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password: string;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}
