import { HttpStatusCode } from '@/shared/enums';

import { AppError, AppErrorInput } from './app';

export const INTERNAL_SERVER_ERROR_MESSAGE = 'errors.internal_server_error';

export class InternalServerError extends AppError {
  public name = 'InternalServerError';

  constructor(input?: Partial<AppErrorInput>) {
    super({
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: INTERNAL_SERVER_ERROR_MESSAGE,
      sendToSlack: true,
      ...input,
    });
  }
}
