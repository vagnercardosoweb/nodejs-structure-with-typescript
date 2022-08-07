import { HttpStatusCode } from '@/enums';

import { AppError, Options } from './app';

export class NotAcceptableError extends AppError {
  constructor(options?: Options) {
    super({
      code: 'not_acceptable',
      statusCode: HttpStatusCode.NOT_ACCEPTABLE,
      message: 'error.not_acceptable',
      ...options,
    });

    this.name = 'NotAcceptableError';
  }
}
