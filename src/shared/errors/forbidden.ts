import { HttpStatusCode } from '@/shared/enums';

import { AppError, Options } from './app';

export class ForbiddenError extends AppError {
  constructor(options?: Options) {
    super({
      code: 'FORBIDDEN',
      statusCode: HttpStatusCode.FORBIDDEN,
      message: 'errors.forbidden',
      ...options,
    });

    this.name = 'ForbiddenError';
  }
}
