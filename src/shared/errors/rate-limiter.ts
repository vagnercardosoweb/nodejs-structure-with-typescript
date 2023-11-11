import { HttpStatusCode } from '@/shared/enums';

import { AppError, AppErrorInput } from './app';

export class RateLimiterError extends AppError {
  public name = 'RateLimiterError';

  constructor(input?: Partial<AppErrorInput>) {
    super({
      code: 'RATE_LIMITER',
      statusCode: HttpStatusCode.MANY_REQUEST,
      message: 'errors.rate_limiter',
      sendToSlack: false,
      ...input,
    });
  }
}
