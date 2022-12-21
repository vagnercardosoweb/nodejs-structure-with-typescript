import { HttpStatusCode } from '@/enums';

import { AppError, Options } from './app';

export class BadRequestError extends AppError {
  constructor(options?: Options) {
    super({
      code: 'bad_request',
      statusCode: HttpStatusCode.BAD_REQUEST,
      message: 'error.bad_request',
      sendToSlack: false,
      ...options,
    });

    this.name = 'BadRequestError';
  }
}
