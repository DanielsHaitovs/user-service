import {
  SYSTEM_USER_EMAIL,
  SYSTEM_USER_PASSWORD,
} from '@/commonConst/user.const';
import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsString } from 'class-validator';

export class AuthenticateDto {
  @ApiProperty({
    description: 'The email of the user',
    example: SYSTEM_USER_EMAIL,
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
export class AuthenticateResponseDto {
  @ApiProperty({
    description: 'The JWT token for authenticated user',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ5OTBkNjVhLWQwMGYtNDQ3ZC1hMGY5LTZkNzNhYjI5NzUyMyIsImVtYWlsIjoic3lzdGVtQG1lY1NlcnZpY2UuY29tIiwicGVybWlzc2lvbnMiOlsicm9vdF9hZG1pbiJdLCJpYXQiOjE3ODA5MTkwMjIsImV4cCI6MTc4MDkyMjYyMn0.xD4KkK726fctMtGYnA6_3IxTssNLnwOHwzmeXjz9oWA',
    required: true,
  })
  @IsString()
  token: string;

  constructor(token: string) {
    this.token = token;
  }
}
