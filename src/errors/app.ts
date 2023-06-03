import { HttpStatusCode } from '@/enums';
import { Util } from '@/shared';

export interface Options {
  code?: string;
  message: string;
  errorId?: string;
  requestId?: string;
  description?: string;
  metadata?: Record<string, any>;
  statusCode?: HttpStatusCode;
  originalError?: Error;
  sendToSlack?: boolean;
  logging?: boolean;
}

export class AppError extends Error {
  constructor(options: Options) {
    super(options.message);
    this.name = 'AppError';
    if (!options.errorId) options.errorId = AppError.generateErrorId();
    const { originalError, ...rest } = options;
    Object.entries(rest).forEach(([key, value]) =>
      this.setProperty(key, value),
    );
    this.setProperty('name', this.name);
    this.setProperty('message', this.message);
    this.setProperty('stack', this.stack);
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
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  public static generateErrorId(): string {
    return Util.randomNumber(1_000_000_000, 9_999_999_999).toString();
  }

  protected setProperty(key: string, value: any) {
    if (Util.isUndefined(value)) return;
    Object.defineProperty(this, key, {
      writable: true,
      enumerable: true,
      configurable: true,
      value,
    });
  }
}
