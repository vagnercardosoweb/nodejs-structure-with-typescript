import { randomInt } from 'node:crypto';

import { INTERNAL_SERVER_ERROR_MESSAGE } from '@/shared';
import { HttpStatusCode } from '@/shared/enums';
import { Utils } from '@/shared/utils';

export class AppError extends Error {
  public code: string;
  public name = 'AppError';
  public message: string;
  public description?: string;
  public metadata: Metadata = {};
  public statusCode: HttpStatusCode;
  public sendToSlack: boolean;
  public originalError?: Error | { name?: string; message: string };
  public logging: boolean;
  public requestId?: string;
  public errorId: string;

  constructor(options: Options = {}) {
    if (!options.code) options.code = 'DEFAULT';
    if (!options.errorId) options.errorId = AppError.generateErrorId();
    if (!options.statusCode) {
      options.statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
    }

    if (Utils.isUndefined(options.sendToSlack)) options.sendToSlack = true;
    if (Utils.isUndefined(options.logging)) options.logging = true;

    super(options.message ?? INTERNAL_SERVER_ERROR_MESSAGE);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);

    const { originalError, ...rest } = options;
    Object.entries(rest).forEach(([k, v]) => this.setProperty(k, v));

    const replaces = {
      ...options.metadata,
      errorId: this.errorId,
      requestId: this.requestId,
      code: this.code,
    };

    if (originalError?.message) {
      this.setProperty('original', {
        name: originalError.name,
        message: Utils.replaceKeysInString(originalError.message, replaces),
        stack: originalError.stack,
      });
    }

    this.setProperty(
      'message',
      Utils.replaceKeysInString(this.message, replaces),
    );

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

type Metadata = Record<string, any>;
export type Options = {
  code?: string;
  message?: string;
  description?: string;
  metadata?: Metadata;
  statusCode?: HttpStatusCode;
  sendToSlack?: boolean;
  originalError?: Error;
  requestId?: string;
  logging?: boolean;
  errorId?: string;
};
