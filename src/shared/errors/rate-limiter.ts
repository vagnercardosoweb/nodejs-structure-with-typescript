import { HttpStatusCode } from '@/shared/enums';

import { AppError, Options } from './app';

export class RateLimiterError extends AppError {
  public name = 'RateLimiterError';

  constructor(options?: Partial<Options>) {
    super({
      code: 'RATE_LIMITER',
      statusCode: HttpStatusCode.MANY_REQUEST,
      message: 'errors.rate_limiter',
      sendToSlack: false,
      ...options,
    });
  }
}
