import type { UUID } from 'crypto';

export interface JWTPayload {
  permissions: string[];
  id: UUID;
}

export interface RequestWithUserPermissions extends Request {
  user: JWTPayload;
}
