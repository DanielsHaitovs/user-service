import { Public } from '@/commonDecorators/public.decorator';
import { Controller, Get, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';

import { FastifyReply } from 'fastify';

@Controller({
  path: 'metrics',
  version: VERSION_NEUTRAL,
})
@Public()
export class MetricsController extends PrometheusController {
  @Get()
  override async index(@Res() response: FastifyReply): Promise<string> {
    return super.index(response);
  }
}
