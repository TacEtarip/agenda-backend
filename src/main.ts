import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Global Validation for Data Transfer Objects (DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away properties that don't have decorators
      forbidNonWhitelisted: true, // Throws an error if unwanted properties are sent
      transform: true, // Automatically transforms payloads to DTO instances
    }),
  );

  // Best Practice Security settings
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
