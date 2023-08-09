import { HttpStatusCode } from '@/shared/enums';

import { AppError, Options } from './app';

export class UnauthorizedError extends AppError {
  public name = 'UnauthorizedError';

  constructor(options?: Partial<Options>) {
    super({
      code: 'UNAUTHORIZED',
      statusCode: HttpStatusCode.UNAUTHORIZED,
      message: 'errors.unauthorized',
      sendToSlack: false,
      ...options,
    });
  }
}
