import IORedis, { RedisOptions } from 'ioredis';

import { Env } from '@/shared/env';
import Logger from '@/shared/logger';

export class Redis {
  private static instance: Redis | null = null;
  private client: IORedis;
  private keyPrefix: string | undefined;
  private logger: typeof Logger;
  private connected = false;

  private constructor() {
    this.logger = Logger.newInstance('REDIS');
  }

  public static getInstance(): Redis {
    if (this.instance === null) this.instance = new Redis();
    return this.instance;
  }

  public async connect(options?: RedisOptions): Promise<Redis> {
    if (this.connected) return this;
    const prefix = options?.keyPrefix ?? Env.get('REDIS_KEY_PREFIX', 'app');
    this.keyPrefix = this.normalizeKeyPrefix(prefix);
    this.client = new IORedis({
      port: Env.get('REDIS_PORT', 6379),
      host: Env.get('REDIS_HOST'),
      password: Env.get('REDIS_PASSWORD'),
      db: Env.get('REDIS_DATABASE', 0),
      ...options,
      keyPrefix: this.keyPrefix,
      lazyConnect: true,
    });
    this.logger.info('connecting to redis');
    await this.client.connect();
    this.connected = true;
    return this;
  }

  public getIoRedis(): IORedis {
    return this.client;
  }

  public async set(key: string, value: any, expired?: number) {
    value = JSON.stringify(value);
    if (expired) {
      await this.client.set(key, value, 'EX', expired);
    } else {
      await this.client.set(key, value);
    }
    return value;
  }

  public async close(): Promise<void> {
    if (!this.connected) return;
    this.logger.info('closing redis');
    await this.client.quit();
    this.connected = false;
  }

  public async get<T>(
    key: string,
    defaultValue?: T,
    expired?: number,
  ): Promise<T | null> {
    let result = await this.client.get(key);
    if (!result && defaultValue) {
      result =
        typeof defaultValue === 'function'
          ? await defaultValue.apply(this)
          : defaultValue;
      if (result) {
        await this.set(key, result, expired);
        return result as T;
      }
    }
    return result !== null ? JSON.parse(result) : null;
  }

  public async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result > 0;
  }

  public async delete(key: string): Promise<boolean> {
    const result = await this.client.del(key);
    return result > 0;
  }

  public async deletePrefix(prefix: string): Promise<void> {
    const keys = await this.client.keys(this.mergePrefix(prefix));
    await Promise.all(
      keys.map((key) => this.delete(this.removeKeyPrefix(key))),
    );
  }

  public async getByPrefix(prefix: string) {
    const keys = await this.client.keys(this.mergePrefix(prefix));
    return Promise.all(keys.map((key) => this.get(this.removeKeyPrefix(key))));
  }

  private removeKeyPrefix(prefix: string): string {
    if (!this.keyPrefix?.length) return prefix;
    return prefix.replace(this.keyPrefix, '');
  }

  private normalizeKeyPrefix(prefix?: string) {
    if (prefix?.length && !prefix.endsWith(':')) return `${prefix}:`;
    return prefix;
  }

  private mergePrefix(prefix: string): string {
    return `${this.keyPrefix}${prefix}`;
  }
}
