import type { UUID } from 'crypto';

export interface RequestWithUserPermissions extends Request {
  user: {
    permissions: string[];
    id: UUID;
  };
}
