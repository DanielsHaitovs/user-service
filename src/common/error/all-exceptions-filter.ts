import { getTraceId } from '@/utils/trace.util';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import type { FastifyRequest } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly errorStatusToKeep = new Set([
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
    HttpStatus.CONFLICT,
  ]);

  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.UNPROCESSABLE_ENTITY;

    const request = ctx.getRequest<FastifyRequest>();

    const isError = exception instanceof Error;
    const errorMessage = isError ? exception.message : 'Unknown internal error';

    const logPayload = {
      trace: `[Trace: ${getTraceId() ?? ''}] <- ${statusCode.toString()} ${request.method} ${request.url}`,
      statusCode,
      err: exception,
    };

    this.logger.error(logPayload, errorMessage);

    const hideError = !this.errorStatusToKeep.has(statusCode);

    const responseBody = {
      statusCode: hideError ? HttpStatus.UNPROCESSABLE_ENTITY : statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: hideError ? UnprocessableEntityException.name : errorMessage,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, statusCode);
  }
}
