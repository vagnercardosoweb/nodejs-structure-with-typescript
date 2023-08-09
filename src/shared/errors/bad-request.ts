import { HttpStatusCode } from '@/shared/enums';
import { AppError, Options } from '@/shared/errors';

export class BadRequestError extends AppError {
  public name = 'BadRequestError';

  constructor(options?: Options) {
    super({
      code: 'BAD_REQUEST',
      statusCode: HttpStatusCode.BAD_REQUEST,
      message: 'errors.bad_request',
      sendToSlack: false,
      ...options,
    });
  }
}
