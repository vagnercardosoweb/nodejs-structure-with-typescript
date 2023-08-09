import { HttpStatusCode } from '@/shared/enums';

import { AppError, Options } from './app';

export class UnprocessableEntityError extends AppError {
  public name = 'UnprocessableEntityError';

  constructor(options?: Options) {
    super({
      code: 'UNPROCESSABLE_ENTITY',
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
      message: 'errors.unprocessable_entity',
      ...options,
    });
  }
}
