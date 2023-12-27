import { randomInt } from 'node:crypto';

import dottie from 'dottie';

import { INTERNAL_SERVER_ERROR_MESSAGE } from '@/config/constants';
import { HttpStatusCode } from '@/shared/enums';
import { Utils } from '@/shared/utils';

export class AppError extends Error {
  public code = 'DEFAULT';
  public name = 'AppError';
  public message: string;
  public description?: string;
  public metadata: Metadata = {};
  public statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
  public originalError?: OriginalError;
  public shouldReplaceKeys = true;
  public replaceKeys: Metadata = {};
  public sendToSlack = true;
  public requestId?: string;
  public logging = true;
  public errorId: string;

  constructor(input: AppErrorInput = {}) {
    if (!input.errorId) input.errorId = AppError.generateErrorId();

    input.message = input.message ?? INTERNAL_SERVER_ERROR_MESSAGE;
    super(input.message);

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);

    const { originalError, ...rest } = input;
    Object.entries(rest).forEach(([k, v]) => this.setProperty(k, v));

    this.setProperty(
      'replaceKeys',
      this.shouldReplaceKeys
        ? dottie.flatten({
            errorId: this.errorId,
            requestId: this.requestId,
            ...this.replaceKeys,
          })
        : {},
    );

    this.setProperty('message', this.replaceKeysInString(this.message));

    if (originalError) {
      this.setProperty('originalError', {
        ...originalError,
        name: originalError.name,
        message: this.replaceKeysInString(originalError.message),
        stack: originalError.stack,
      });
    }

    this.setProperty('stack', this.stack);
  }

  public static generateErrorId(): string {
    return `V${randomInt(1_000_000_000, 9_999_999_999).toString()}C`;
  }

  private replaceKeysInString(message: string) {
    if (!this.shouldReplaceKeys) return message;
    return Utils.replaceKeysInString(message, this.replaceKeys);
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

type OriginalError = {
  name?: string;
  message: string;
  stack?: string;
};

type Metadata = Record<string, any>;

export type AppErrorInput = {
  code?: string;
  message?: string;
  description?: string;
  metadata?: Metadata;
  statusCode?: HttpStatusCode;
  originalError?: OriginalError;
  shouldReplaceKeys?: boolean;
  replaceKeys?: Metadata;
  sendToSlack?: boolean;
  requestId?: string;
  logging?: boolean;
  errorId?: string;
};
