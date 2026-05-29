import { EntityNotFoundFilter } from '@/common/error/entity-not-found.filter';
import { EnvConfigService } from '@/config/env/env.config.service';
import { Environment } from '@/config/env/env.validation';
import { swaggerSetupOptions } from '@/config/swagger.config';
import { LoggingInterceptor } from '@/interceptors/logging.interceptor';
import { ResponseTimeInterceptor } from '@/interceptors/response-time.interceptor';
import { AppModule } from '@/src/app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const envConfig = app.get(EnvConfigService);

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseTimeInterceptor(),
  );

  app.useGlobalFilters(new EntityNotFoundFilter());

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
    .addTag('Users Authorizarion', 'User authentication management operations')
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

  const logger = new Logger(bootstrap.name);

  const document = SwaggerModule.createDocument(app, config.build());

  SwaggerModule.setup('api', app, document, swaggerSetupOptions);

  const port = Number(envConfig.apiPort) || 3000;

  await app.listen(port);

  if (envConfig.nodeEnv === Environment.Development) {
    logger.debug('You are in development mode');

    if (!envConfig.requireAuth) {
      logger.debug('Authentication is disabled');
    }
  }
}

void bootstrap();
