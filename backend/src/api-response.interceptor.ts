import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

type PaginatedResult = {
  data: unknown;
  meta: Record<string, unknown>;
  message?: string;
};

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<{
      statusCode: number;
    }>();

    return next.handle().pipe(
      map((result: unknown) => {
        if (response.statusCode === 204) return undefined;

        const message =
          isPaginatedResult(result) && result.message
            ? result.message
            : response.statusCode === 201
              ? 'Created'
              : 'OK';

        if (isPaginatedResult(result)) {
          return {
            success: true,
            message,
            data: result.data,
            meta: result.meta,
          };
        }

        return {
          success: true,
          message,
          data: result ?? null,
        };
      }),
    );
  }
}

function isPaginatedResult(value: unknown): value is PaginatedResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value &&
    typeof value.meta === 'object' &&
    value.meta !== null
  );
}
