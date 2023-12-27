import { UNAUTHORIZED_ERROR_MESSAGE } from '@/config/constants';
import { HttpStatusCode } from '@/shared/enums';
import { AppError, AppErrorInput } from '@/shared/errors';

export class UnauthorizedError extends AppError {
  public name = 'UnauthorizedError';

  constructor(input?: Partial<AppErrorInput>) {
    super({
      code: 'UNAUTHORIZED',
      statusCode: HttpStatusCode.UNAUTHORIZED,
      message: UNAUTHORIZED_ERROR_MESSAGE,
      sendToSlack: false,
      ...input,
    });
  }
}
