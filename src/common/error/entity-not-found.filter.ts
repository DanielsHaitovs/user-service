import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

import type { FastifyReply } from 'fastify';
import { EntityNotFoundError } from 'typeorm';

@Catch(EntityNotFoundError)
export class EntityNotFoundFilter implements ExceptionFilter {
  catch(exception: EntityNotFoundError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const reply = ctx.getResponse<FastifyReply>();

    reply.status(404).send({
      statusCode: 404,
      message: exception.message,
      error: 'EntityNotFoundError',
    });
  }
}
