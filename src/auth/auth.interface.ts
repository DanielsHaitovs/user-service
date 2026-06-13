import type { UUID } from 'crypto';
import type { FastifyRequest } from 'fastify';

export interface JwtPayload {
  id: UUID;
  email: string;
  permissions: string[];
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: JwtPayload | undefined;
}
