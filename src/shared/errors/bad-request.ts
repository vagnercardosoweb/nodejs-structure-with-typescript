import { HttpStatusCode } from '@/shared/enums';
import { AppError, AppErrorInput } from '@/shared/errors';

export class BadRequestError extends AppError {
  public name = 'BadRequestError';

  constructor(input?: AppErrorInput) {
    super({
      code: 'BAD_REQUEST',
      statusCode: HttpStatusCode.BAD_REQUEST,
      message: 'errors.bad_request',
      sendToSlack: false,
      ...input,
    });
  }
}
