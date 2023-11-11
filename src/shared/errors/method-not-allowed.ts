import { HttpStatusCode } from '@/shared/enums';

import { AppError, AppErrorInput } from './app';

type Input = Omit<AppErrorInput, 'message'> & {
  path: string;
  method: string;
  message?: string;
};

export class MethodNotAllowedError extends AppError {
  public name = 'MethodNotAllowedError';

  constructor({ path, method, ...input }: Input) {
    super({
      code: 'METHOD_NOT_ALLOWED',
      metadata: { path, method },
      statusCode: HttpStatusCode.METHOD_NOT_ALLOWED,
      message: 'errors.method_not_allowed',
      sendToSlack: false,
      logging: false,
      ...input,
    });
  }
}
