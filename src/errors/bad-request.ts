import { HttpStatusCode } from '@/enums';

import { AppError, Options } from './app';

export class BadRequestError extends AppError {
  constructor(options?: Options) {
    super({
      code: 'BAD_REQUEST',
      statusCode: HttpStatusCode.BAD_REQUEST,
      message: 'errors.bad_request',
      sendToSlack: false,
      ...options,
    });

    this.name = 'BadRequestError';
  }
}
