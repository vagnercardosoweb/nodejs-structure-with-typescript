import { HttpStatusCode } from '@/shared/enums';

import { AppError, Options } from './app';

export class ForbiddenError extends AppError {
  public name = 'ForbiddenError';

  constructor(options?: Options) {
    super({
      code: 'FORBIDDEN',
      statusCode: HttpStatusCode.FORBIDDEN,
      message: 'errors.forbidden',
      ...options,
    });
  }
}
