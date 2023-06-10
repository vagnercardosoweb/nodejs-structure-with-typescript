import { HttpStatusCode } from '@/shared/enums';

import { AppError, Options } from './app';

export class ConflictError extends AppError {
  constructor(options?: Options) {
    super({
      code: 'CONFLICT',
      statusCode: HttpStatusCode.CONFLICT,
      message: 'errors.conflict',
      ...options,
    });

    this.name = 'ConflictError';
  }
}
