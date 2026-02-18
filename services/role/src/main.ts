import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JsonLogger } from './infrastructure/logging/json-logger';
import { ApplicationErrorFilter } from './presentation/http/filters/application-error.filter';

async function bootstrap() {
  const logger = new JsonLogger();
  Logger.overrideLogger(logger);
  const app = await NestFactory.create(AppModule, { logger });
  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new ApplicationErrorFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
