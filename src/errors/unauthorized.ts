import { HttpStatusCode } from '@/enums';

import { AppError, Options } from './app';

export class UnauthorizedError extends AppError {
  constructor(options?: Partial<Options>) {
    super({
      code: 'unauthorized',
      statusCode: HttpStatusCode.UNAUTHORIZED,
      message: 'error.unauthorized',
      ...options,
    });

    this.name = 'UnauthorizedError';
  }
}
