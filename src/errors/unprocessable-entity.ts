import { HttpStatusCode } from '@/enums';

import { AppError, Options } from './app';

export class UnprocessableEntityError extends AppError {
  constructor(options?: Options) {
    super({
      code: 'UNPROCESSABLE_ENTITY',
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
      message: 'errors.unprocessable_entity',
      ...options,
    });

    this.name = 'UnprocessableEntityError';
  }
}
