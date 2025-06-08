import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  const config = new DocumentBuilder()
    .setTitle('Chess API Documentation') // Tiêu đề tài liệu
    .setDescription('API description') // Mô tả API
    .setVersion('1.0') // Phiên bản API
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Đường dẫn truy cập Swagger UI: /api
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
