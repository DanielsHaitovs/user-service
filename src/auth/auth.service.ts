import { AuthenticateDto, ResetPasswordDto } from '@/auth/auth.dto';
import { JwtPayload } from '@/auth/auth.interface';
import { EnvConfigService } from '@/config/env/env.config.service';
import { User } from '@/userEntities/user.entity';
import { UserRolesService } from '@/userRoleServices/role.service';
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
    private readonly userRoleService: UserRolesService,
  ) {}

  async signIn(data: AuthenticateDto): Promise<string> {
    const { email, password } = data;

    const user = await this.getByEmailOrThrow(email);

    console.log('User found for authentication:', user);
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException();
    }
    // const { password, ...result } = user;
    // Generate a JWT and return it here
    // instead of the user object

    const permissions = await this.userRoleService.getPermissionsOrThrow(
      user.id,
    );

    const payload: JwtPayload = { id: user.id, email, password, permissions };

    return await this.jwtService.signAsync(payload);
  }

  async resetPassword(data: ResetPasswordDto): Promise<void> {
    const { email, password, newPassword } = data;

    const user = await this.getByEmailOrThrow(email);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException();
    }

    user.password = await bcrypt.hash(
      newPassword,
      this.envConfigService.passwordSaltRounds,
    );
    await this.entityManager.save(user);
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
