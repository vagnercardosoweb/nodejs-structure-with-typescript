import { HttpStatusCode } from '@/enums';

export interface Options {
  code?: string;
  message: string;
  description?: string;
  metadata?: Record<string, any>;
  statusCode?: HttpStatusCode;
  originalError?: Error;
}

export class AppError extends Error {
  constructor(options: Options) {
    super(options.message);
    this.name = 'AppError';
    const { originalError, ...rest } = options;
    Object.entries(rest).forEach(([key, value]) => {
      this.defineProperty(key, value);
    });
    this.defineProperty(
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

  protected defineProperty(key: string, value: any) {
    Object.defineProperty(this, key, {
      writable: false,
      enumerable: true,
      value,
    });
  }
}
