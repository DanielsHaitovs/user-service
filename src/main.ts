import { ensureSystemUser } from '@/base/system-user.bootstrap';
import { EntityNotFoundFilter } from '@/common/error/entity-not-found.filter';
import { swaggerSetupOptions } from '@/config/swagger.config';
import { LoggingInterceptor } from '@/interceptors/logging.interceptor';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await ensureSystemUser(app);

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalFilters(new EntityNotFoundFilter());

  const config = new DocumentBuilder()
    .setTitle('MakeEasyCommerce User API')
    .setDescription('E-commerce platform User API documentation')
    .setVersion('1.0')
    .addTag('App', 'Health check and basic operations')
    .addTag('Auth', 'Auth in management operations')
    .addTag('Me', 'Authenticated user session in management operations')
    .addTag('Users', 'User management operations')
    .addTag('Users Roles', 'User Roles management operations')
    .addTag('Departments', 'Departments management operations')
    .addTag('Roles', 'Roles management operations')
    .addTag('Permissions', 'Permissions management operations')
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
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, swaggerSetupOptions);

  const port = Number(process.env.API_PORT) || 3000;
  await app.listen(port);
}

void bootstrap();
