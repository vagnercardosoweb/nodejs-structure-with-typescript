import { HttpStatusCode } from '@/shared/enums';

import { AppError, Options } from './app';

export class NotFoundError extends AppError {
  public name = 'NotFoundError';

  constructor(options?: Options) {
    super({
      code: 'NOT_FOUND',
      statusCode: HttpStatusCode.NOT_FOUND,
      message: 'errors.not_found',
      ...options,
    });
  }
}
