import { randomInt } from 'node:crypto';

import dottie from 'dottie';

import { HttpStatusCode } from '@/shared/enums';
import { Utils } from '@/shared/utils';

type Metadata = Record<string, any>;

export interface Options {
  code?: string;
  message?: string;
  description?: string;
  metadata?: Metadata;
  statusCode?: HttpStatusCode;
  sendToSlack?: boolean;
  requestId?: string;
  original?: Error;
  logging?: boolean;
  errorId?: string;
}

export class AppError extends Error {
  public code: string;
  public name = 'AppError';
  public message: string;
  public description?: string;
  public metadata: Metadata = {};
  public statusCode: HttpStatusCode;
  public sendToSlack: boolean;
  public original?: Error;
  public logging: boolean;
  public requestId?: string;
  public errorId: string;

  constructor(options: Options = {}) {
    if (!options.code) options.code = 'DEFAULT';
    if (!options.statusCode) {
      options.statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
    }
    if (!options.errorId) options.errorId = AppError.generateErrorId();

    if (Utils.isUndefined(options.logging)) options.logging = true;
    if (Utils.isUndefined(options.sendToSlack)) options.sendToSlack = true;

    if (!options.message) {
      options.message =
        'An error occurred, contact support and report the code [{{errorId}}]';
    }

    super(options.message);

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);

    const { original, ...rest } = options;
    Object.entries(rest).forEach(([k, v]) => this.setProperty(k, v));

    const replaces = dottie.flatten({
      ...options.metadata,
      errorId: this.errorId,
      requestId: this.requestId,
      code: this.code,
    });

    if (original?.message) {
      this.setProperty('original', {
        name: original.name,
        message: this.replaceMessage(original.message, replaces),
        stack: original.stack,
      });
    }

    this.setProperty('message', this.replaceMessage(this.message, replaces));
    this.setProperty('stack', this.stack);
  }

  public static generateErrorId(): string {
    return `V${randomInt(1_000_000_000, 9_999_999_999).toString()}C`;
  }

  private replaceMessage(message: string, metadata: Metadata): string {
    for (const key in metadata) {
      message = message.replace(`{{${key}}}`, metadata[key]);
    }
    return message;
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
