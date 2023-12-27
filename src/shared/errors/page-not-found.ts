import { HttpStatusCode } from '@/shared/enums';
import { AppError, AppErrorInput } from '@/shared/errors';

type Input = AppErrorInput & {
  method: string;
  path: string;
};

export class PageNotFoundError extends AppError {
  public name = 'PageNotFoundError';

  constructor({ path, method, ...input }: Input) {
    super({
      code: 'PAGE_NOT_FOUND',
      replaceKeys: { path, method },
      statusCode: HttpStatusCode.NOT_FOUND,
      message: 'errors.page_not_found',
      sendToSlack: false,
      logging: false,
      ...input,
    });
  }
}
