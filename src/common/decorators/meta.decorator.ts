import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface ClientMetadata {
  ipAddress: string;
  userAgent: string;
}

interface RequestWithClientMetadata {
  ip: string;
  headers: Record<string, string | undefined>;
}

export const GetClientMetadata = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ClientMetadata => {
    const request = ctx.switchToHttp().getRequest<RequestWithClientMetadata>();
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? 'unknown',
    };
  },
);
