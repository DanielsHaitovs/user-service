import { CurrentUser } from '@/lib/guard/current-user.decorator';
import { User } from '@/user/entities/user.entity';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../common/decorators/permission.decorator';
import { PermissionsGuard } from '../common/guards/permission.guard';

@ApiTags('Me')
@Controller('me')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class MeController {
  @Get('me')
  @Permissions('user:create')
  getProfile(@CurrentUser() user: User): User {
    return user;
  }
}
