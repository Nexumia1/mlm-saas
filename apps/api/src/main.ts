import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger Documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('MLM SaaS API')
      .setDescription('API de la plataforma SaaS para equipos MLM y marketing de afiliados')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticación y sesiones')
      .addTag('users', 'Gestión de usuarios')
      .addTag('tenants', 'Multi-tenant management')
      .addTag('crm', 'CRM — Contactos y Leads')
      .addTag('campaigns', 'Campañas publicitarias')
      .addTag('whatsapp', 'WhatsApp Business API')
      .addTag('analytics', 'Métricas y Analytics')
      .addTag('automations', 'Automatizaciones')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    logger.log(`📚 Swagger docs: http://localhost:${process.env.PORT || 4000}/api/docs`);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 API corriendo en http://localhost:${port}/api/v1`);
}

bootstrap();
