import { NestFactory } from '@nestjs/core';
import {
  HttpStatus,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule, ObserveInstrument } from './app.module.js';
import { ApiExceptionFilter } from './api-exception.filter.js';
import { ApiResponseInterceptor } from './api-response.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (validationErrors) => {
        const errors: Record<string, string[]> = {};
        flattenValidationErrors(validationErrors, '', errors);
        return new UnprocessableEntityException({
          message: 'Validasi gagal',
          errors,
        });
      },
    }),
  );
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

type ValidationNode = {
  property: string;
  constraints?: Record<string, string>;
  children?: ValidationNode[];
};

function flattenValidationErrors(
  validationErrors: ValidationNode[],
  prefix: string,
  output: Record<string, string[]>,
): void {
  for (const error of validationErrors) {
    const path = prefix ? `${prefix}.${error.property}` : error.property;
    const messages = Object.values(error.constraints ?? {});
    if (messages.length) output[path] = messages;
    if (error.children?.length) {
      flattenValidationErrors(error.children, path, output);
    }
  }
}
