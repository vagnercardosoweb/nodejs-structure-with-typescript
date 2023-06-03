import { HttpStatusCode } from '@/enums';

import { AppError, Options } from './app';

export class NotAcceptableError extends AppError {
  constructor(options?: Options) {
    super({
      code: 'NOT_ACCEPTABLE',
      statusCode: HttpStatusCode.NOT_ACCEPTABLE,
      message: 'errors.not_acceptable',
      ...options,
    });

    this.name = 'NotAcceptableError';
  }
}
