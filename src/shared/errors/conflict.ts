import { HttpStatusCode } from '@/shared/enums';
import { AppError, AppErrorInput } from '@/shared/errors';

export class ConflictError extends AppError {
  public name = 'ConflictError';

  constructor(input?: AppErrorInput) {
    super({
      code: 'CONFLICT',
      statusCode: HttpStatusCode.CONFLICT,
      message: 'errors.conflict',
      ...input,
    });
  }
}
