import { HttpStatusCode } from '@/enums';

import { AppError, Options } from './app';

export class NotFoundError extends AppError {
  constructor(options?: Options) {
    super({
      code: 'not_found',
      statusCode: HttpStatusCode.NOT_FOUND,
      message: 'errors.not_found',
      ...options,
    });

    this.name = 'NotFoundError';
  }
}
