import { RoleAction } from '@/common/enum/action.enum';
import { ROLE_AUDIT_QUEUE } from '@/commonConst/queue.const';
import { RoleResponseDto } from '@/roleDto/role.dto';
import { getTraceId } from '@/utils/trace.util';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';

import { Queue } from 'bullmq';
import { UUID } from 'crypto';

export interface AuditLogPayload {
  userId: UUID;
  action: RoleAction;
  details: string;
  targetRoleId: UUID;
  oldState?: Partial<RoleResponseDto> | undefined;
  newState?: Partial<RoleResponseDto> | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

interface AuditPayload {
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
      const data: AuditPayload & AuditLogPayload = {
        ...payload,
        traceId: getTraceId(),
      };

      await this.auditQueue.add(`role-audit-${data.action}`, data);
    } catch (e) {
      const error = e as Error;
      this.logger.error(
        'Failed to queue audit log background job for role:',
        error.message,
        error.stack,
      );
    }
  }
}
