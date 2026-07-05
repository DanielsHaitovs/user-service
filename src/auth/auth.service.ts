import { AuthenticateDto, AuthenticateResponseDto } from '@/auth/auth.dto';
import { JwtPayload } from '@/auth/auth.interface';
import { AuthCacheService } from '@/auth/cache.service';
import { EnvConfigService } from '@/config/env/env.config.service';
import { Environment } from '@/config/env/env.validation';
import { UserRolePipelineService } from '@/user/role.pipeline';
import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userServices/helper.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { UserStorePipelineService } from '../user/store.pipeline';

@Injectable()
export class AuthService {
  constructor(
    private readonly envConfigService: EnvConfigService,
    private readonly jwtService: JwtService,
    private readonly userRoleService: UserRolePipelineService,
    private readonly userStoreService: UserStorePipelineService,
    private readonly userHelperService: UserHelperService,
    private readonly cacheService: AuthCacheService,
  ) {}

  async signIn(data: AuthenticateDto): Promise<AuthenticateResponseDto> {
    const { email, password } = data;

    const { id, password: hashedPassword } = await this.validateUserByEmail({
      email,
    });

    const isMatch = await bcrypt.compare(password, hashedPassword);

    if (!isMatch) {
      throw new UnauthorizedException();
    }

    const [permissions, stores] = await Promise.all([
      this.userRoleService.getPermissions(id),
      this.userStoreService.getAssignedStores(id),
    ]);

    const payload: JwtPayload = {
      id,
      email,
      permissions,
      stores: stores.map((store) => store.id),
    };

    const token = await this.jwtService.signAsync(payload);

    await this.cacheService.set({ payload, token });

    return { token };
  }

  private async validateUserByEmail({
    email,
  }: {
    email: string;
  }): Promise<User> {
    const user = await this.userHelperService.getByEmail({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (
      !this.envConfigService.requireAuth &&
      this.envConfigService.nodeEnv !== Environment.Production
    ) {
      return user;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email is not verified');
    }

    return user;
  }
}
