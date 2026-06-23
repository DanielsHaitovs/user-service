import { ROLE_AUDIT_QUEUE } from '@/commonConst/queue.const';
import { RoleAction } from '@/role/action.enum';
import { RoleResponseDto } from '@/roleDto/role.dto';
import { getTraceId } from '@/utils/trace.util';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';

import { Queue } from 'bullmq';
import { UUID } from 'crypto';

interface AuditLogPayload {
  userId: UUID;
  action: RoleAction;
  details: string;
  targetRoleId: UUID;
  oldState?: Partial<RoleResponseDto> | undefined;
  newState?: Partial<RoleResponseDto> | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  traceId?: string | undefined;
}

@Injectable()
export class AuditProducerService {
  private readonly logger = new Logger('Role Audit Changes Producer');
  constructor(
    @InjectQueue(ROLE_AUDIT_QUEUE)
    private readonly auditQueue: Queue,
  ) {}

  async sendLog(payload: AuditLogPayload): Promise<void> {
    try {
      payload.traceId = getTraceId();
      await this.auditQueue.add(`role-audit-${payload.action}`, payload);
    } catch (e) {
      const error = e as Error;
      this.logger.error(
        'Failed to queue audit log background job:',
        error.message,
        error.stack,
      );
    }
  }
}
