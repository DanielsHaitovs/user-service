import { ApiProperty } from '@nestjs/swagger';

import { IsString, MaxLength, MinLength } from 'class-validator';

export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
  })
  @IsString()
  @MaxLength(500)
  @MinLength(20)
  access_token: string;

  constructor(accessToken: string) {
    this.access_token = accessToken;
  }
}
