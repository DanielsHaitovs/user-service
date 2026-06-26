import { StoreAction } from '@/common/enum/action.enum';
import { STORE_AUDIT_QUEUE } from '@/commonConst/queue.const';
import { GetStoreDto } from '@/storeDto/store.dto';
import { getTraceId } from '@/utils/trace.util';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';

import { Queue } from 'bullmq';
import { UUID } from 'crypto';

export interface AuditLogPayload {
  userId: UUID;
  action: StoreAction;
  details: string;
  targetStoreId: UUID;
  oldState?: Partial<GetStoreDto> | undefined;
  newState?: Partial<GetStoreDto> | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

interface AuditPayload {
  traceId?: string | undefined;
}

@Injectable()
export class AuditProducerService {
  private readonly logger = new Logger('Store Audit Changes Producer');
  constructor(
    @InjectQueue(STORE_AUDIT_QUEUE)
    private readonly auditQueue: Queue,
  ) {}

  async sendLog(payload: AuditLogPayload): Promise<void> {
    try {
      const data: AuditPayload & AuditLogPayload = {
        ...payload,
        traceId: getTraceId(),
      };

      await this.auditQueue.add(`store-audit-${data.action}`, data);
    } catch (e) {
      const error = e as Error;
      this.logger.error(
        'Failed to queue audit log background job for store:',
        error.message,
        error.stack,
      );
    }
  }
}
