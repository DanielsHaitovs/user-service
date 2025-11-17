import { SeedService } from '@/seed/seed.service';
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get('entire-user/:amount')
  @ApiParam({ name: 'amount', type: Number })
  async seed(@Param('amount', ParseIntPipe) amount: number): Promise<void> {
    await this.seedService.seedUserRelationsBatched(amount);
  }
}
