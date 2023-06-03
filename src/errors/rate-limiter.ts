import { HttpStatusCode } from '@/enums';

import { AppError, Options } from './app';

export class RateLimiterError extends AppError {
  constructor(options?: Partial<Options>) {
    super({
      code: 'RATE_LIMITER',
      statusCode: HttpStatusCode.MANY_REQUEST,
      message: 'errors.rate_limiter',
      sendToSlack: false,
      ...options,
    });

    this.name = 'RateLimiterError';
  }
}
