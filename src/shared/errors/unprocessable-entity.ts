import { HttpStatusCode } from '@/shared/enums';
import { AppError, AppErrorInput } from '@/shared/errors';

export class UnprocessableEntityError extends AppError {
  public name = 'UnprocessableEntityError';

  constructor(input?: AppErrorInput) {
    super({
      code: 'UNPROCESSABLE_ENTITY',
      statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
      message: 'errors.unprocessable_entity',
      ...input,
    });
  }
}
