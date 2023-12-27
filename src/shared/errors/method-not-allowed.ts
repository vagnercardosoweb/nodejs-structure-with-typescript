import { HttpStatusCode } from '@/shared/enums';
import { AppError, AppErrorInput } from '@/shared/errors';

type Input = AppErrorInput & {
  method: string;
  path: string;
};

export class MethodNotAllowedError extends AppError {
  public name = 'MethodNotAllowedError';

  constructor({ path, method, ...input }: Input) {
    super({
      code: 'METHOD_NOT_ALLOWED',
      replaceKeys: { path, method },
      statusCode: HttpStatusCode.METHOD_NOT_ALLOWED,
      message: 'errors.method_not_allowed',
      sendToSlack: false,
      logging: false,
      ...input,
    });
  }
}
