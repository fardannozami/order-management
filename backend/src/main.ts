import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import {
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule, ObserveInstrument } from './app.module.js';
import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { ApiResponseInterceptor } from './common/api-response.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.setGlobalPrefix('api');
  const logger = new Logger('HTTP');
  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();
    response.on('finish', () => {
      logger.log(
        `${request.method} ${request.path} ${response.statusCode} ${Date.now() - startedAt}ms`,
      );
    });
    next();
  });

  const openApiConfig = new DocumentBuilder()
    .setTitle('Order Management API')
    .setDescription('API untuk aplikasi manajemen order')
    .setVersion('1.0.0')
    .addServer(`http://localhost:${process.env.PORT ?? 3000}`, 'Local development')
    .addTag('Auth')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  app.use('/openapi.json', (_request: Request, response: Response) => {
    response.json(openApiDocument);
  });
  const scalarHandler = apiReference({
    content: openApiDocument,
    theme: 'purple',
  }) as RequestHandler;
  app.use('/', (request: Request, response: Response, next: NextFunction) => {
    if (request.path === '/' && request.method === 'GET') {
      scalarHandler(request, response, next);
      return;
    }
    next();
  });
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
