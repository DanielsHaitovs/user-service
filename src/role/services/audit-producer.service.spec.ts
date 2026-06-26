import type { RoleAction } from '@/common/enum/action.enum';
import { STORE_AUDIT_QUEUE } from '@/commonConst/queue.const';
import {
  type AuditLogPayload,
  AuditProducerService,
} from '@/roleServices/audit.service';
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
  let queueMock: jest.Mocked<Pick<Queue, 'add'>>;

  beforeEach(async () => {
    queueMock = {
      add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditProducerService,
        {
          provide: getQueueToken(STORE_AUDIT_QUEUE),
          useValue: queueMock,
        },
      ],
    }).compile();

    service = module.get<AuditProducerService>(AuditProducerService);

    jest.clearAllMocks();
  });

  it('should be successfully instantiated', () => {
    expect(service).toBeDefined();
  });

  describe('sendLog', () => {
    it('should append the current active trace ID and push the job into the BullMQ cluster', async () => {
      const mockTraceId = 'abc-123-trace-id';
      (getTraceId as jest.Mock).mockReturnValue(mockTraceId);

      const payload: AuditLogPayload = {
        userId: randomUUID(),
        action: 'CREATE' as RoleAction,
        details: 'New retail store location launched.',
        targetRoleId: randomUUID(),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      await service.sendLog(payload);

      expect(getTraceId).toHaveBeenCalled();
      expect(payload.traceId).toBe(mockTraceId);

      expect(queueMock.add).toHaveBeenCalledWith(
        'store-audit-CREATE',
        expect.objectContaining({
          traceId: mockTraceId,
          details: 'New retail store location launched.',
        }),
      );
    });

    it('should proceed to log even if the active trace ID is undefined', async () => {
      (getTraceId as jest.Mock).mockReturnValue(undefined);

      const payload: AuditLogPayload = {
        userId: randomUUID(),
        action: 'UPDATE' as RoleAction,
        details: 'Store operation hours updated.',
        targetRoleId: randomUUID(),
      };

      await service.sendLog(payload);

      expect(payload.traceId).toBeUndefined();
      expect(queueMock.add).toHaveBeenCalledWith('store-audit-UPDATE', payload);
    });

    it('should catch database or queue client drops and handle them smoothly without bubbling up exceptions', async () => {
      (getTraceId as jest.Mock).mockReturnValue('active-trace');

      const queueError = new Error('Redis connection lost');
      queueMock.add.mockRejectedValue(queueError);

      const payload: AuditLogPayload = {
        userId: randomUUID(),
        action: 'DELETE' as RoleAction,
        details: 'Store location permanently archived.',
        targetRoleId: randomUUID(),
      };

      await expect(service.sendLog(payload)).resolves.not.toThrow();
    });
  });
});
