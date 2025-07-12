import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { JwtStrategy } from '@/auth/strategies/jwt.strategy';
import { UserModule } from '@/user/user.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { RolesModule } from '../modules/role/role.module';

import { MeController } from './me.controller';

@Module({
  imports: [
    ConfigModule,
    UserModule,
    RolesModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');

        if (secret === undefined) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }

        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN') ?? '1h',
          },
        };
      },
    }),
  ],
  controllers: [AuthController, MeController],
  providers: [AuthService, JwtStrategy],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AuthModule {}
