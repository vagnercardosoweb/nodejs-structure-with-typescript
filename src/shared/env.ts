import process from 'node:process';

import { NodeEnv } from '@/shared/enums';
import { InternalServerError } from '@/shared/errors';
import { isEmptyValue, normalizeValue } from '@/shared/utils';

export class Env {
  public static get(key: string, defaultValue?: any) {
    let value = process.env[key];
    if (!value) return defaultValue;

    if (value.startsWith('${') && value.endsWith('}')) {
      const extendedValue = process.env[value.slice(2, -1)];
      if (!isEmptyValue(extendedValue)) value = extendedValue;
    }

    return normalizeValue(value);
  }

  public static has(key: string): boolean {
    return isEmptyValue(process.env[key]) === false;
  }

  public static set(key: string, value: any, override = true) {
    if (!override && process.env.hasOwnProperty(key)) return;
    process.env[key] = normalizeValue(value);
  }

  public static required(key: string, defaultValue?: any) {
    const value = this.get(key, defaultValue);
    if (isEmptyValue(value)) {
      throw InternalServerError.fromMessage(
        `The environment variable "${key}" is required.`,
      );
    }
    return value;
  }

  public static isLocal(): boolean {
    return Env.get('NODE_ENV') === NodeEnv.LOCAL || Env.get('IS_LOCAL', false);
  }

  public static isProduction(): boolean {
    return Env.get('NODE_ENV') === NodeEnv.PRODUCTION;
  }

  public static isStaging(): boolean {
    return Env.get('NODE_ENV') === NodeEnv.STAGING;
  }

  public static isTesting(): boolean {
    return Env.get('NODE_ENV') === NodeEnv.TEST;
  }
}
