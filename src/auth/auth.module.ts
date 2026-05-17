import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { Roles } from '@/roleEntities/role.entity';
import { User } from '@/userEntities/user.entity';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnvConfigService } from '../config/env/env.config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Roles, UserRoles]),
    JwtModule.registerAsync({
      useFactory: (configService: EnvConfigService) => ({
        secret: configService.jwtSecret,
        secretOrPrivateKey: configService.jwtSecret,
        signOptions: {
          expiresIn: configService.jwtExpiration,
        },
      }),
      inject: [EnvConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AuthModule {}
