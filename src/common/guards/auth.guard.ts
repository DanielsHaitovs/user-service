import { RequestWithUserPermissions } from '@/authInterfaces/req.interface';
import { ROOT_ADMIN_PERMISSION } from '@/roleConst/permission.const';
import { SYSTEM_USER_EMAIL } from '@/userConst/user.const';
import { User } from '@/userEntities/user.entity';
import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

@Injectable()
export class AuthenticationGuard extends AuthGuard('jwt') {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      process.env.REQUIRE_AUTH === 'false' &&
      process.env.NODE_ENV === 'development'
    ) {
      const request = context
        .switchToHttp()
        .getRequest<RequestWithUserPermissions>();

      const user = await this.userRepository.findOne({
        where: { email: SYSTEM_USER_EMAIL },
      });

      if (user == undefined) {
        throw new ForbiddenException('User not found');
      }

      request.user = {
        id: user.id,
        permissions: [ROOT_ADMIN_PERMISSION],
      };

      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }
}
