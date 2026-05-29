import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { UUID } from 'crypto';

@Injectable()
export class SystemIdentityService {
  private systemUserId: UUID | undefined;

  setSystemUserId(id: UUID): void {
    this.systemUserId = id;
  }

  getSystemUserId(): UUID {
    if (this.systemUserId == undefined) {
      throw new InternalServerErrorException(
        'System User ID has not been initialized yet.',
      );
    }

    return this.systemUserId;
  }
}
