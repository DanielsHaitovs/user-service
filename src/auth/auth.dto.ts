import { EXAMPLE_USER_EMAIL } from '@/lib/const/user.const';
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
    example: 'password123',
    required: true,
  })
  @IsString()
  password: string;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}
