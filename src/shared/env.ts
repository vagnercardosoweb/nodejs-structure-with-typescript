import { InternalServerError } from '@/errors';

import { Util } from './util';

export class Env {
  public static get(key: string, defaultValue?: any) {
    const value = process.env[key] || defaultValue;
    return Util.normalizeValue(value);
  }

  public static set(key: string, value: any) {
    process.env[key] = Util.normalizeValue(value);
  }

  public static required(key: string, defaultValue?: any) {
    const value = this.get(key, defaultValue);
    if (!value) {
      throw new InternalServerError({
        message: `process.env[${key}] is not defined`,
      });
    }
    return value;
  }
}
