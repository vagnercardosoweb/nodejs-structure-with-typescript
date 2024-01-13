import { HttpStatusCode } from '@/shared/enums';
import { AppError, AppErrorInput } from '@/shared/errors';

export class ForbiddenError extends AppError {
  public name = 'ForbiddenError';

  constructor(input?: AppErrorInput) {
    super({
      code: 'FORBIDDEN',
      statusCode: HttpStatusCode.FORBIDDEN,
      message: 'errors.forbidden',
      sendToSlack: false,
      ...input,
    });
  }
}
