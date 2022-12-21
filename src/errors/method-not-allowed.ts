import { HttpStatusCode } from '@/enums';

import { AppError, Options as AppOptions } from './app';

interface Options extends Omit<AppOptions, 'message'> {
  path: string;
  method: string;
  message?: string;
}

export class MethodNotAllowedError extends AppError {
  constructor({ path, method, ...options }: Options) {
    super({
      code: 'method_not_allowed',
      metadata: { path, method },
      statusCode: HttpStatusCode.METHOD_NOT_ALLOWED,
      message: 'error.method_not_allowed',
      sendToSlack: false,
      ...options,
    });

    this.name = 'MethodNotAllowedError';
  }
}
