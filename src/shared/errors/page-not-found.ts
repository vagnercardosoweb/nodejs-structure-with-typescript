import { HttpStatusCode } from '@/shared/enums';

import { AppError, AppErrorInput } from './app';

type Input = Omit<AppErrorInput, 'message'> & {
  path: string;
  method: string;
  message?: string;
};

export class PageNotFoundError extends AppError {
  public name = 'PageNotFoundError';

  constructor({ path, method, ...input }: Input) {
    super({
      code: 'PAGE_NOT_FOUND',
      metadata: { path, method },
      statusCode: HttpStatusCode.NOT_FOUND,
      message: 'errors.page_not_found',
      sendToSlack: false,
      logging: false,
      ...input,
    });
  }
}
