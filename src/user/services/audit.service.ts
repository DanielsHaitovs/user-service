import { UserAction, UserScope } from '@/common/enum/action.enum';
import { USER_AUDIT_QUEUE } from '@/commonConst/queue.const';
import { GetRelatedRoleDto } from '@/roleDto/role.dto';
import { GetRelatedStoreDto } from '@/storeDto/store.dto';
import { UserResponseDto } from '@/userDto/user.dto';
import { getTraceId } from '@/utils/trace.util';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';

import { Queue } from 'bullmq';
import { UUID } from 'crypto';

export interface AuditLogPayload {
  createdAt: Date;
  userId: UUID;
  action: UserAction;
  details: string;
  targetUserId: UUID;
  oldState: Partial<
    UserResponseDto | GetRelatedRoleDto[] | GetRelatedStoreDto[]
  > | null;
  newState: Partial<
    UserResponseDto | GetRelatedRoleDto[] | GetRelatedStoreDto[]
  > | null;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditPayload {
  traceId: string;
  scope: UserScope;
}

@Injectable()
export class AuditProducerService {
  private readonly logger = new Logger('User Audit Changes Producer');
  constructor(
    @InjectQueue(USER_AUDIT_QUEUE)
    private readonly auditQueue: Queue,
  ) {}

  async sendLog(payload: AuditLogPayload): Promise<void> {
    await this.sendAuditLog(payload, UserScope.USER);
  }

  async sendStoreLog(payload: AuditLogPayload): Promise<void> {
    await this.sendAuditLog(payload, UserScope.STORE);
  }

  async sendRoleLog(payload: AuditLogPayload): Promise<void> {
    await this.sendAuditLog(payload, UserScope.ROLE);
  }

  private async sendAuditLog(
    payload: AuditLogPayload,
    scope: UserScope,
  ): Promise<void> {
    try {
      const data: AuditPayload & AuditLogPayload = {
        ...payload,
        traceId: getTraceId() ?? 'no-trace-id',
        scope: UserScope.STORE,
      };

      await this.auditQueue.add(`user-${scope}-audit-${data.action}`, data);
    } catch (e) {
      const error = e as Error;
      this.logger.error(
        'Failed to queue audit log background job for user store:',
        error.message,
        error.stack,
      );
    }
  }
}
