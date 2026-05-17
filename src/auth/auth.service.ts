import { AuthenticateDto } from '@/auth/auth.dto';
import { EnvConfigService } from '@/config/env/env.config.service';
import { User } from '@/userEntities/user.entity';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectEntityManager } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { EntityManager } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly envConfigService: EnvConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(data: AuthenticateDto): Promise<string> {
    const { email, password } = data;

    const user = await this.getByEmailOrThrow(email);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException();
    }
    // const { password, ...result } = user;
    // Generate a JWT and return it here
    // instead of the user object

    const payload = { email, password };

    return await this.jwtService.signAsync(payload);
  }

  private async getByEmailOrThrow(email: string): Promise<User> {
    const user = await this.entityManager.findOneBy(User, {
      email,
    });

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
