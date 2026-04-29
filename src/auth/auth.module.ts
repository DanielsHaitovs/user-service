import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { Roles } from '@/roleEntities/role.entity';
import { User } from '@/userEntities/user.entity';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Roles, UserRoles]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'secret',
        secretOrPrivateKey: configService.get<string>('JWT_SECRET') ?? 'secret',
        signOptions: {
          expiresIn: configService.get<number>('JWT_EXPIRATION') ?? 3600,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AuthModule {}
