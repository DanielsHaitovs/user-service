import type { UUID } from 'crypto';
import type { Request } from 'express';

export interface JwtPayload {
  id: UUID;
  email: string;
  password: string;
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
