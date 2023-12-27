import { HttpStatusCode } from '@/shared/enums';
import { AppError, AppErrorInput } from '@/shared/errors';

export class NotFoundError extends AppError {
  public name = 'NotFoundError';

  constructor(input?: AppErrorInput) {
    super({
      code: 'NOT_FOUND',
      statusCode: HttpStatusCode.NOT_FOUND,
      message: 'errors.not_found',
      ...input,
    });
  }
}
