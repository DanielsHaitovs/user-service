import { Public } from '@/commonDecorators/public.decorator';
import { Controller, Get, Res, VERSION_NEUTRAL } from '@nestjs/common';

import { FastifyReply } from 'fastify';

@Controller({
  path: 'health',
  version: VERSION_NEUTRAL,
})
@Public()
export class HealthController {
  @Get()
  getHealth(@Res() response: FastifyReply): void {
    response.status(200).send({ status: 'ok' });
  }
}
