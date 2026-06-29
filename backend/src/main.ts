import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import * as path from 'path';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security HTTP Headers
  app.use(helmet({
    crossOriginResourcePolicy: false, // Allow local client to fetch images/uploads
  }));

  // Enable CORS
  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:3000', 'http://127.0.0.1:3000'];
    
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin, 'null' (for local file double-clicks), file:// schemes, localhost/127.0.0.1, or configured list
      if (
        !origin ||
        origin === 'null' ||
        origin.startsWith('file://') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        corsOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, corsOrigins);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable gzip compression
  app.use(compression());

  // Serve uploads folder as static files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Global DTO Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Setup Swagger/OpenAPI Docs
  const config = new DocumentBuilder()
    .setTitle('EasyCafe API')
    .setDescription('Production-ready backend API documentation for EasyCafe portal')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`=======================================================`);
  logger.log(`EasyCafe Backend Service running on port ${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  logger.log(`=======================================================`);
}
bootstrap();
