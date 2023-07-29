import { INTERNAL_SERVER_ERROR_MESSAGE } from '@/shared';
import { HttpStatusCode } from '@/shared/enums';

import { AppError, Options } from './app';

export class InternalServerError extends AppError {
  public name = 'InternalServerError';

  constructor(options?: Partial<Options>) {
    super({
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: INTERNAL_SERVER_ERROR_MESSAGE,
      sendToSlack: true,
      ...options,
    });
  }
}
