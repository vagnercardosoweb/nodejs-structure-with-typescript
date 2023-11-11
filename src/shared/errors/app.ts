import { randomInt } from 'node:crypto';

import dottie from 'dottie';

import { INTERNAL_SERVER_ERROR_MESSAGE } from '@/shared';
import { HttpStatusCode } from '@/shared/enums';
import { Utils } from '@/shared/utils';

export class AppError extends Error {
  public code: string = 'DEFAULT';
  public name = 'AppError';
  public message: string;
  public description?: string;
  public metadata: Metadata = {};
  public statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
  public originalError?: MyError;
  public sendToSlack: boolean = true;
  public requestId?: string;
  public logging: boolean = true;
  public errorId: string;

  constructor(input: AppErrorInput = {}) {
    if (!input.errorId) input.errorId = AppError.generateErrorId();

    input.message = input.message ?? INTERNAL_SERVER_ERROR_MESSAGE;
    super(input.message);

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);

    const { originalError, ...rest } = input;
    Object.entries(rest).forEach(([k, v]) => this.setProperty(k, v));

    const replaces = dottie.flatten({
      ...input.metadata,
      errorId: this.errorId,
      requestId: this.requestId,
      code: this.code,
    });

    this.setProperty(
      'message',
      Utils.replaceKeysInString(this.message, replaces),
    );

    if (originalError) {
      this.setProperty('originalError', {
        name: originalError.name,
        message: Utils.replaceKeysInString(originalError.message, replaces),
        stack: originalError.stack,
      });
    }

    this.setProperty('stack', this.stack);
  }

  public static generateErrorId(): string {
    return `V${randomInt(1_000_000_000, 9_999_999_999).toString()}C`;
  }

  private setProperty(key: string, value: any) {
    if (value === undefined) return;
    Object.defineProperty(this, key, {
      writable: true,
      enumerable: true,
      configurable: true,
      value,
    });
  }
}

type MyError = { name?: string; message: string; stack?: string };
type Metadata = Record<string, any>;
export type AppErrorInput = {
  code?: string;
  message?: string;
  description?: string;
  metadata?: Metadata;
  statusCode?: HttpStatusCode;
  originalError?: Error;
  sendToSlack?: boolean;
  requestId?: string;
  logging?: boolean;
  errorId?: string;
};
