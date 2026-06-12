import { AllExceptionsFilter } from '@/common/error/all-exceptions-filter';
import { EntityNotFoundFilter } from '@/common/error/entity-not-found.filter';
import { EnvConfigService } from '@/config/env/env.config.service';
import { Environment } from '@/config/env/env.validation';
import { swaggerSetupOptions } from '@/config/swagger.config';
import { LoggingInterceptor } from '@/interceptors/logging.interceptor';
import { ResponseTimeInterceptor } from '@/interceptors/response-time.interceptor';
import { AppModule } from '@/src/app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { Logger } from 'nestjs-pino';

// import { Logger, PinoLogger } from 'nestjs-pino';
// import pino from 'pino';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));

  const envConfig = app.get(EnvConfigService);

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseTimeInterceptor(),
  );

  const httpAdapter = app.get(HttpAdapterHost);

  app.useGlobalFilters(
    new EntityNotFoundFilter(),
    new AllExceptionsFilter(httpAdapter),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidUnknownValues: true,
      validateCustomDecorators: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MakeEasyCommerce User API')
    .setDescription('E-commerce platform User API documentation')
    .setVersion('1.0')
    .addTag('App', 'Health check and basic operations')
    .addTag('Auth', 'Authentication operations')
    .addTag('Users', 'User management operations')
    .addTag('Users Roles', 'User roles management operations')
    .addTag('Users Stores', 'User stores management operations')
    .addTag('Roles', 'Roles management operations')
    .addTag('Roles Permissions', 'Roles permissions management operations')
    .addTag('Permissions', 'Permissions management operations')
    .addServer('/users')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    );

  // if (envConfig.nodeEnv === 'development') {
  //   config.addTag('Seed', 'Seed operations');
  // }

  const document = SwaggerModule.createDocument(app, config.build());

  SwaggerModule.setup('api', app, document, swaggerSetupOptions);

  const port = Number(envConfig.apiPort) || 3000;

  await app.listen(port, '0.0.0.0');

  // const logger = new Logger({ context: 'Bootstrap' });
  const logger = app.get(Logger);
  // const pinoLogger = app.get(PinoLogger); // 🎯 Grab the inner provider

  if (
    envConfig.nodeEnv === Environment.Development ||
    envConfig.nodeEnv === Environment.Test
  ) {
    logger.debug('You are in development mode');

    if (!envConfig.requireAuth) {
      logger.debug('Authentication is disabled');
    }
  }

  setInterval(() => {
    const start = Date.now();
    setTimeout(() => {
      const lag = Date.now() - start;
      if (lag > 100) {
        logger.warn(
          `EVENT LOOP LAG: ${lag.toString()}ms - Something is blocking the thread!`,
        );
      }
    });
  }, 1000);

  process.on('uncaughtException', (err: Error) => {
    const nodeErr = err as NodeJS.ErrnoException;

    if (nodeErr.code === 'ENOBUFS') {
      logger.warn('Network buffer overflowing (ENOBUFS). Dropping a socket.');
      return;
    }

    logger.error('FATAL UNCAUGHT EXCEPTION:', err);
    process.exit(1);
  });
}

void bootstrap();
