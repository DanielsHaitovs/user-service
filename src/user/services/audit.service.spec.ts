import { UserAction, UserScope } from '@/common/enum/action.enum';
import { USER_AUDIT_QUEUE } from '@/commonConst/queue.const';
import {
  type AuditLogPayload,
  AuditProducerService,
} from '@/user/services/audit.service';
import { getTraceId } from '@/utils/trace.util';
import { getQueueToken as getBullQueueToken } from '@nestjs/bullmq';
import type { Logger } from '@nestjs/common';
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
  const mockTargetUserId = randomUUID();
  const mockTraceId = 'test-trace-id-12345';

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-id' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditProducerService,
        {
          provide: getBullQueueToken(USER_AUDIT_QUEUE),
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

  describe('Log Dispatches', () => {
    let basePayload: AuditLogPayload;

    beforeEach(() => {
      basePayload = {
        createdAt: new Date('2026-06-26'),
        userId: mockUserId,
        action: UserAction.CREATE,
        details: 'User account provisioned successfully.',
        targetUserId: mockTargetUserId,
        oldState: null,
        newState: { email: 'test@example.com' },
      };
    });

    it('should successfully append trace context and dispatch a USER scoped log path', async () => {
      (getTraceId as jest.Mock).mockReturnValue(mockTraceId);

      await service.sendLog(basePayload);

      expect(getTraceId).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith(
        `user-${UserScope.USER}-audit-${UserAction.CREATE}`,
        expect.objectContaining({
          traceId: mockTraceId,
          scope: UserScope.STORE,
          details: 'User account provisioned successfully.',
        }),
      );
    });

    it('should fall back to "no-trace-id" string literal if active context returns undefined', async () => {
      (getTraceId as jest.Mock).mockReturnValue(undefined);

      await service.sendLog(basePayload);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          traceId: 'no-trace-id',
        }),
      );
    });

    it('should successfully append trace context and dispatch a STORE scoped log path', async () => {
      (getTraceId as jest.Mock).mockReturnValue(mockTraceId);
      basePayload.action = UserAction.UPDATE;

      await service.sendStoreLog(basePayload);

      expect(mockQueue.add).toHaveBeenCalledWith(
        `user-${UserScope.STORE}-audit-${UserAction.UPDATE}`,
        expect.objectContaining({
          traceId: mockTraceId,
          scope: UserScope.STORE,
        }),
      );
    });

    it('should successfully append trace context and dispatch a ROLE scoped log path', async () => {
      (getTraceId as jest.Mock).mockReturnValue(mockTraceId);
      basePayload.action = UserAction.DELETE;

      await service.sendRoleLog(basePayload);

      expect(mockQueue.add).toHaveBeenCalledWith(
        `user-${UserScope.ROLE}-audit-${UserAction.DELETE}`,
        expect.objectContaining({
          traceId: mockTraceId,
          scope: UserScope.STORE,
        }),
      );
    });
  });

  describe('Exception Guard Rails', () => {
    it('should capture queue dispatch errors and log details smoothly without breaking host processes', async () => {
      const queueOutageError = new Error(
        'Redis connection drop: cluster unreachable',
      );
      mockQueue.add.mockRejectedValue(queueOutageError);

      // 🎯 THE FIX: Spy on the private logger to suppress terminal noise and track invocations
      const targetLogger = (service as unknown as { logger: Logger }).logger;
      const loggerSpy = jest.spyOn(targetLogger, 'error').mockImplementation();

      const failingPayload: AuditLogPayload = {
        createdAt: new Date('2026-06-26'),
        userId: mockUserId,
        action: UserAction.UPDATE,
        details: 'Failure path test case processing description.',
        targetUserId: mockTargetUserId,
        oldState: null,
        newState: null,
      };

      await expect(service.sendLog(failingPayload)).resolves.not.toThrow();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Failed to queue audit log background job for user store:',
        queueOutageError.message,
        queueOutageError.stack,
      );
    });
  });
});
