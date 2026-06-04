import { Logger } from '@nestjs/common';

import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsNotEmpty()
  USER_NODE_ENV: Environment;

  @IsNumber()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  })
  @IsDefined()
  USER_API_PORT: number;

  @IsString()
  @IsNotEmpty()
  USER_DATABASE_NAME: string;

  @IsString()
  @IsNotEmpty()
  USER_DATABASE_HOST: string;

  @IsNumber()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  })
  @IsDefined()
  USER_DATABASE_PORT: number;

  @IsString()
  @IsNotEmpty()
  USER_DATABASE_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  USER_DATABASE_PASSWORD: string;

  @IsBoolean()
  @Transform(({ value }) => {
    return value === 'true';
  })
  @IsNotEmpty()
  USER_DATABASE_SYNC: boolean;

  @IsBoolean()
  @Transform(({ value }) => {
    return value === 'true';
  })
  @IsNotEmpty()
  USER_DATABASE_LOGGING: boolean;

  @IsString()
  @IsNotEmpty()
  USER_JWT_SECRET: string;

  @IsNumber()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  })
  @IsDefined()
  USER_JWT_EXPIRATION: number;

  @IsBoolean()
  @Transform(({ value }) => {
    return value === 'true';
  })
  @IsNotEmpty()
  USER_REQUIRE_AUTH: boolean;

  @IsNumber()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  })
  @IsDefined()
  USER_PASSWEORD_SALT_ROUNDS: number;

  @IsNumber()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  })
  @IsDefined()
  USER_THROTTLE_TTL: number;

  @IsNumber()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  })
  @IsDefined()
  USER_THROTTLE_LIMIT: number;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string;

  @IsString()
  @IsNotEmpty()
  REDIS_PASSWORD: string;

  @IsNumber()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  })
  @IsDefined()
  REDIS_PORT: number;

  @IsNumber()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  })
  @IsDefined()
  USER_CACHE_TTL: number;

  constructor(
    nodeEnv: Environment,
    apiPort: number,
    jwtSecret: string,
    jwtExpiration: number,
    requireAuth: boolean,
    passwordSaltRounds: number,
    databaseName: string,
    databaseHost: string,
    databasePort: number,
    databaseUsername: string,
    databasePassword: string,
    databaseSync: boolean,
    databaseLogging: boolean,
    throttleTtl: number,
    throttleLimit: number,
    redisHost: string,
    redisPassword: string,
    redisPort: number,
    userCacheTtl: number,
  ) {
    this.USER_NODE_ENV = nodeEnv;
    this.USER_API_PORT = apiPort;
    this.USER_JWT_SECRET = jwtSecret;
    this.USER_JWT_EXPIRATION = jwtExpiration;
    this.USER_REQUIRE_AUTH = requireAuth;
    this.USER_PASSWEORD_SALT_ROUNDS = passwordSaltRounds;
    this.USER_DATABASE_NAME = databaseName;
    this.USER_DATABASE_HOST = databaseHost;
    this.USER_DATABASE_PORT = databasePort;
    this.USER_DATABASE_USERNAME = databaseUsername;
    this.USER_DATABASE_PASSWORD = databasePassword;
    this.USER_DATABASE_SYNC = databaseSync;
    this.USER_DATABASE_LOGGING = databaseLogging;
    this.USER_THROTTLE_TTL = throttleTtl;
    this.USER_THROTTLE_LIMIT = throttleLimit;
    this.REDIS_HOST = redisHost;
    this.REDIS_PASSWORD = redisPassword;
    this.REDIS_PORT = redisPort;
    this.USER_CACHE_TTL = userCacheTtl;
  }
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  if (config.USER_NODE_ENV === 'development') {
    const logger = new Logger('EnvValidation');
    logger.verbose('Raw Config from Docker:', config);
  }

  const validatedConfig = plainToInstance(EnvironmentVariables, config);

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints ?? {}))
      .flat();
    throw new Error(
      `Environment validation failed:\n - ${errorMessages.join('\n - ')}`,
    );
  }

  return validatedConfig;
}
