import { HttpStatusCode } from '@/enums';

import { AppError, Options } from './app';

export class RateLimiterError extends AppError {
  constructor(options?: Partial<Options>) {
    super({
      code: 'rate_limiter',
      statusCode: HttpStatusCode.MANY_REQUEST,
      message: 'error.rate_limiter',
      ...options,
    });

    this.name = 'RateLimiterError';
  }
}
