import { swaggerSetupOptions } from '@/config/swagger.config';
import { LoggingInterceptor } from '@/interceptors/logging.interceptor';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('MakeEasyCommerce API')
    .setDescription('E-commerce platform API documentation')
    .setVersion('1.0')
    .addTag('App', 'Health check and basic operations')
    .addTag('Users', 'User management operations')
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
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, swaggerSetupOptions);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}

void bootstrap();
