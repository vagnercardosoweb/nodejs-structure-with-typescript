import { HttpStatusCode } from '@/shared/enums';

import { AppError, Options } from './app';

export class UnauthorizedError extends AppError {
  constructor(options?: Partial<Options>) {
    super({
      code: 'UNAUTHORIZED',
      statusCode: HttpStatusCode.UNAUTHORIZED,
      message: 'errors.unauthorized',
      ...options,
    });

    this.name = 'UnauthorizedError';
  }
}
