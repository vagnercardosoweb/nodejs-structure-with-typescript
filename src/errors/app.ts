import { HttpStatusCode } from '@/enums';
import { Util } from '@/shared';

export interface Options {
  code?: string;
  message: string;
  description?: string;
  metadata?: Record<string, any>;
  statusCode?: HttpStatusCode;
  originalError?: Error;
  sendToSlack?: boolean;
}

export class AppError extends Error {
  constructor(options: Options) {
    super(options.message);
    this.name = 'AppError';
    const { originalError, ...rest } = options;
    Object.entries(rest).forEach(([key, value]) =>
      this.setProperty(key, value),
    );
    this.setProperty('errorId', AppError.generateErrorId());
    this.setProperty(
      'originalError',
      originalError?.stack
        ? {
            name: originalError?.name,
            message: originalError?.message,
            stack: originalError?.stack?.split('\n'),
          }
        : null,
    );
  }

  public static generateErrorId(): string {
    return `API:${Util.randomNumber(1_000_000_000, 9_999_999_999).toString()}`;
  }

  protected setProperty(key: string, value: any) {
    Object.defineProperty(this, key, {
      writable: true,
      enumerable: true,
      value,
    });
  }
}
