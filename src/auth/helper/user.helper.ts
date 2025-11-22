import type { JWTPayload } from '@/auth/interfaces/req.interface';
import { JwtService } from '@nestjs/jwt';

import type { UUID } from 'crypto';
import type { Request } from 'express';

export function sessionUserId({ request }: { request: Request }): UUID {
  const secret = process.env.JWT_SECRET;

  if (secret == undefined) {
    throw new Error('JWT_SECRET not set');
  }

  const jwtService = new JwtService({ secret });
  const token = request.headers.authorization?.replace(/^Bearer\s/, '') ?? '';

  const payload = jwtService.verify<JWTPayload>(token);

  return payload.id;
}
