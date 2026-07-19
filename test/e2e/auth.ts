import type { AuthenticateDto, AuthenticateResponseDto } from '@/auth/auth.dto';
import { HttpStatus } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

export async function loginTestUser({
  app,
  email,
  password,
}: {
  app: NestFastifyApplication;
  email: string;
  password: string;
}): Promise<{ Authorization: string }> {
  const payload: AuthenticateDto = {
    email,
    password,
  };

  const response = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload,
  });

  expect(response.statusCode).toBe(HttpStatus.CREATED);

  const body = JSON.parse(response.payload) as AuthenticateResponseDto;

  expect(body).toHaveProperty('token');
  expect(typeof body.token).toBe('string');

  return {
    Authorization: `Bearer ${body.token}`,
  };
}
