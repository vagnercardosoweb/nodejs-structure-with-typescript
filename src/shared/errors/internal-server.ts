import { HttpStatusCode } from '@/shared/enums';

import { AppError, Options } from './app';

export class InternalServerError extends AppError {
  constructor(options?: Partial<Options>) {
    super({
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      sendToSlack: true,
      message: 'errors.internal_server_error',
      ...options,
    });
    this.name = 'InternalServerError';
  }
}
