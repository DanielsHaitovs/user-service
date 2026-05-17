/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
import { EnvironmentVariables } from '@/config/env/env.validation';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvConfigService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  get nodeEnv(): string {
    return this.configService.get<string>('USER_NODE_ENV', {
      infer: true,
    }) as string;
  }

  get apiPort(): number {
    return this.configService.get<number>('USER_API_PORT', {
      infer: true,
    }) as number;
  }

  get jwtSecret(): string {
    return this.configService.get<string>('USER_JWT_SECRET', {
      infer: true,
    }) as string;
  }

  get jwtExpiration(): number {
    return this.configService.get<number>('USER_JWT_EXPIRATION', {
      infer: true,
    }) as number;
  }

  get requireAuth(): boolean {
    return this.configService.get<boolean>('USER_REQUIRE_AUTH', {
      infer: true,
    }) as boolean;
  }

  get databaseName(): string {
    return this.configService.get<string>('USER_DATABASE_NAME', {
      infer: true,
    }) as string;
  }

  get databaseHost(): string {
    return this.configService.get<string>('USER_DATABASE_HOST', {
      infer: true,
    }) as string;
  }

  get databasePort(): number {
    return this.configService.get<number>('USER_DATABASE_PORT', {
      infer: true,
    }) as number;
  }

  get databaseUsername(): string {
    return this.configService.get<string>('USER_DATABASE_USERNAME', {
      infer: true,
    }) as string;
  }

  get databasePassword(): string {
    return this.configService.get<string>('USER_DATABASE_PASSWORD', {
      infer: true,
    }) as string;
  }

  get databaseSync(): boolean {
    return this.configService.get<boolean>('USER_DATABASE_SYNC', {
      infer: true,
    }) as boolean;
  }

  get databaseLogging(): boolean {
    return this.configService.get<boolean>('USER_DATABASE_LOGGING', {
      infer: true,
    }) as boolean;
  }

  get throttleTtl(): number {
    return this.configService.get<number>('USER_THROTTLE_TTL', {
      infer: true,
    }) as number;
  }

  get throttleLimit(): number {
    return this.configService.get<number>('USER_THROTTLE_LIMIT', {
      infer: true,
    }) as number;
  }
}
