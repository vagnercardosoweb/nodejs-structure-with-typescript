import { HttpStatusCode } from '@/shared/enums';

import { AppError, Options } from './app';

export class ConflictError extends AppError {
  public name = 'ConflictError';

  constructor(options?: Options) {
    super({
      code: 'CONFLICT',
      statusCode: HttpStatusCode.CONFLICT,
      message: 'errors.conflict',
      ...options,
    });
  }
}
