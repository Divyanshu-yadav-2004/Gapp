"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const express = require("express");
const path = require("path");
const helmet_1 = require("helmet");
const compression = require("compression");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: false,
    }));
    const corsOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:3000', 'http://127.0.0.1:3000'];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin ||
                origin === 'null' ||
                origin.startsWith('file://') ||
                origin.includes('localhost') ||
                origin.includes('127.0.0.1') ||
                corsOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(null, corsOrigins);
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.use(compression());
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('EasyCafe API')
        .setDescription('Production-ready backend API documentation for EasyCafe portal')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`=======================================================`);
    logger.log(`EasyCafe Backend Service running on port ${port}`);
    logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
    logger.log(`=======================================================`);
}
bootstrap();
//# sourceMappingURL=main.js.map