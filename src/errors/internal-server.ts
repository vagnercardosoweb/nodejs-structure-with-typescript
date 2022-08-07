import { HttpStatusCode } from '@/enums';

import { AppError, Options } from './app';

export class InternalServerError extends AppError {
  constructor(options?: Partial<Options>) {
    super({
      code: 'internal_server_error',
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: 'error.internal_server_error',
      ...options,
    });

    this.name = 'InternalServerError';
  }
}
