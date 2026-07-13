import type { StoreAction } from '@/common/enum/action.enum';
import { STORE_AUDIT_QUEUE } from '@/commonConst/queue.const';
import {
  type AuditLogPayload,
  AuditProducerService,
} from '@/storeServices/audit.service';
import { getTraceId } from '@/utils/trace.util';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, type TestingModule } from '@nestjs/testing';

import type { Queue } from 'bullmq';
import { randomUUID } from 'crypto';

jest.mock('@/utils/trace.util', () => ({
  getTraceId: jest.fn(),
}));

describe('AuditProducerService', () => {
  let service: AuditProducerService;
  let mockQueue: jest.Mocked<Pick<Queue, 'add'>>;

  const mockUserId = randomUUID();
  const mockTargetStoreId = randomUUID();
  const mockTraceId = 'store-trace-coordinate-999';

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditProducerService,
        {
          provide: getQueueToken(STORE_AUDIT_QUEUE),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<AuditProducerService>(AuditProducerService);

    (getTraceId as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendLog', () => {
    let basePayload: AuditLogPayload;

    beforeEach(() => {
      basePayload = {
        userId: mockUserId,
        action: 'CREATE' as StoreAction,
        details: 'Retail store branch successfully initialized.',
        targetStoreId: mockTargetStoreId,
        oldState: undefined,
        newState: { name: 'Main Street Depot' },
      };
    });

    it('should attach the active system trace ID and drop the payload into the BullMQ cluster', async () => {
      (getTraceId as jest.Mock).mockReturnValue(mockTraceId);

      await service.sendLog(basePayload);

      expect(getTraceId).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith(
        `store-audit-CREATE`,
        expect.objectContaining({
          traceId: mockTraceId,
          details: 'Retail store branch successfully initialized.',
          targetStoreId: mockTargetStoreId,
        }),
      );
    });

    it('should successfully append undefined if the tracking helper resolves without a trace ID context', async () => {
      (getTraceId as jest.Mock).mockReturnValue(undefined);

      await service.sendLog(basePayload);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          traceId: undefined,
        }),
      );
    });

    it('should catch queue connection drops safely and log diagnostic messages without interrupting runtime threads', async () => {
      const queueDriverError = new Error('Redis instance went away');
      mockQueue.add.mockRejectedValue(queueDriverError);

      const loggerSpy = jest
        // eslint-disable-next-line @typescript-eslint/dot-notation
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      await expect(service.sendLog(basePayload)).resolves.not.toThrow();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Failed to queue audit log background job for store:',
        queueDriverError.message,
        queueDriverError.stack,
      );
    });
  });
});
