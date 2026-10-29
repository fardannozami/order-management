import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

type ErrorBody = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const status = getApiStatus(exception);
    const body = getErrorBody(exception, status);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // Keep the response generic while retaining the exception for server logs.
      console.error(exception);
    }

    response.status(status).json(body);
  }
}

function getApiStatus(exception: unknown): number {
  if (!(exception instanceof HttpException)) return HttpStatus.INTERNAL_SERVER_ERROR;

  const status = exception.getStatus();
  if (status === HttpStatus.BAD_REQUEST) return HttpStatus.UNPROCESSABLE_ENTITY;
  if (status >= 500) return HttpStatus.INTERNAL_SERVER_ERROR;
  if ([401, 403, 404, 409, 422].includes(status)) return status;
  if (status >= 400) return HttpStatus.UNPROCESSABLE_ENTITY;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

function getErrorBody(exception: unknown, status: number): ErrorBody {
  if (!(exception instanceof HttpException)) {
    return { success: false, message: 'Internal server error' };
  }

  const exceptionBody = exception.getResponse();
  if (typeof exceptionBody === 'string') {
    return {
      success: false,
      message: status === 500 ? 'Internal server error' : exceptionBody,
    };
  }

  if (typeof exceptionBody === 'object' && exceptionBody !== null) {
    const body = exceptionBody as Record<string, unknown>;
    const errors = isStringArrayMap(body.errors) ? body.errors : undefined;
    const message =
      typeof body.message === 'string'
        ? body.message
        : Array.isArray(body.message)
          ? 'Validasi gagal'
          : status === 500
            ? 'Internal server error'
            : exception.message;

    return {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    };
  }

  return {
    success: false,
    message:
      status === 500 ? 'Internal server error' : exception.message,
  };
}

function isStringArrayMap(value: unknown): value is Record<string, string[]> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every(
      (messages) =>
        Array.isArray(messages) && messages.every((item) => typeof item === 'string'),
    )
  );
}
