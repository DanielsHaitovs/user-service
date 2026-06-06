import { AuthenticateDto } from '@/auth/auth.dto';
import { JwtPayload } from '@/auth/auth.interface';
import { EnvConfigService } from '@/config/env/env.config.service';
import { User } from '@/userEntities/user.entity';
import { UserRolesService } from '@/userRoleServices/role.service';
import { UserHelperService } from '@/userServices/helper.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { CacheService } from '../base/service/cache.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly envConfigService: EnvConfigService,
    private readonly jwtService: JwtService,
    private readonly userRoleService: UserRolesService,
    private readonly userHelperService: UserHelperService,
    private readonly cacheService: CacheService,
  ) {}

  async signIn(data: AuthenticateDto): Promise<string> {
    const { email, password } = data;

    const user = await this.validateUserByEmail(email);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException();
    }

    const permissions = await this.userRoleService.getPermissionsOrThrow(
      user.id,
    );

    const payload: JwtPayload = {
      id: user.id,
      email,
      permissions,
    };

    const token = await this.jwtService.signAsync(payload);

    await this.cacheService.set({
      key: `auth_token:${token}`,
      value: payload,
      ttl: this.envConfigService.jwtExpiration * 1000,
    });

    return token;
  }

  private async validateUserByEmail(email: string): Promise<User> {
    const user = await this.userHelperService.getByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!this.envConfigService.requireAuth) {
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
