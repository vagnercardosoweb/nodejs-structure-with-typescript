import { HttpStatusCode } from '@/shared/enums';
import { AppError, AppErrorInput } from '@/shared/errors';

export class NotAcceptableError extends AppError {
  public name = 'NotAcceptableError';

  constructor(input?: AppErrorInput) {
    super({
      code: 'NOT_ACCEPTABLE',
      statusCode: HttpStatusCode.NOT_ACCEPTABLE,
      message: 'errors.not_acceptable',
      ...input,
    });
  }
}
