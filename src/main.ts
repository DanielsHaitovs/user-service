import { EntityNotFoundFilter } from '@/common/error/entity-not-found.filter';
import { swaggerSetupOptions } from '@/config/swagger.config';
import { LoggingInterceptor } from '@/interceptors/logging.interceptor';
import { ResponseTimeInterceptor } from '@/interceptors/response-time.interceptor';
import { AppModule } from '@/src/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

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

  // if (process.env.NODE_ENV === 'development') {
  //   config.addTag('Seed', 'Seed operations');
  // }

  const logger = new Logger(bootstrap.name);

  const document = SwaggerModule.createDocument(app, config.build());

  SwaggerModule.setup('api', app, document, swaggerSetupOptions);

  const port = Number(process.env.USER_API_PORT) || 3000;
  await app.listen(port);

  if (process.env.NODE_ENV === 'development') {
    logger.warn('You are in development mode');

    if (process.env.REQUIRE_AUTH === 'false') {
      logger.warn('Authentication is disabled');
    }
  }
}

void bootstrap();
