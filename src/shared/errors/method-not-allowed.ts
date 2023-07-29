import { HttpStatusCode } from '@/shared/enums';

import { AppError, Options as AppOptions } from './app';

interface Options extends Omit<AppOptions, 'message'> {
  path: string;
  method: string;
  message?: string;
}

export class MethodNotAllowedError extends AppError {
  public name = 'MethodNotAllowedError';

  constructor({ path, method, ...options }: Options) {
    super({
      code: 'METHOD_NOT_ALLOWED',
      metadata: { path, method },
      statusCode: HttpStatusCode.METHOD_NOT_ALLOWED,
      message: 'errors.method_not_allowed',
      sendToSlack: false,
      logging: false,
      ...options,
    });
  }
}
