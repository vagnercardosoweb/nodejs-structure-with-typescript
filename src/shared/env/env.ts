import { InternalServerError, NodeEnv, Utils } from '@/shared';

export class Env {
  public static get(key: string, defaultValue?: any) {
    const value = process.env[key];
    if (!value?.trim()) return defaultValue;
    return Utils.normalizeValue(value);
  }

  public static has(key: string): boolean {
    return !!process.env[key];
  }

  public static set(key: string, value: any, override = true) {
    if (!override && process.env.hasOwnProperty(key)) return;
    process.env[key] = Utils.normalizeValue(value);
  }

  public static required(key: string, defaultValue?: any) {
    const value = this.get(key, defaultValue);
    if (Utils.isUndefined(value)) {
      throw new InternalServerError({
        message: `The environment variable "${key}" is required.`,
      });
    }
    return value;
  }

  public static getTimezoneUtc(): string {
    return 'UTC';
  }

  public static getTimezoneBrl(): string {
    return 'America/Sao_Paulo';
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
