import { HttpStatusCode } from '@/shared/enums';

import { AppError, AppErrorInput } from './app';

export class UnauthorizedError extends AppError {
  public name = 'UnauthorizedError';

  constructor(input?: Partial<AppErrorInput>) {
    super({
      code: 'UNAUTHORIZED',
      statusCode: HttpStatusCode.UNAUTHORIZED,
      message: 'errors.unauthorized',
      sendToSlack: false,
      ...input,
    });
  }
}
