import IORedis, { RedisOptions } from 'ioredis';

import { Env } from '@/shared/env';
import Logger from '@/shared/logger';

export class Redis {
  private static instance: Redis | null = null;
  private client: IORedis | null = null;
  private keyPrefix: string | undefined;
  protected logger: typeof Logger;

  private constructor() {
    this.logger = Logger.newInstance('REDIS');
  }

  public static getInstance(): Redis {
    if (this.instance === null) {
      this.instance = new Redis();
    }
    return this.instance;
  }

  public async connect(options?: RedisOptions): Promise<Redis> {
    if (this.client !== null) return this;
    const prefix = options?.keyPrefix ?? Env.get('REDIS_KEY_PREFIX');
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
    return this;
  }

  public getClient(): IORedis {
    if (this.client === null) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  public async set(key: string, value: any, expired?: number) {
    value = JSON.stringify(value);
    if (expired) {
      await this.getClient().set(key, value, 'EX', expired);
    } else {
      await this.getClient().set(key, value);
    }
    return value;
  }

  public async close(): Promise<void> {
    this.logger.info('closing redis');
    if (this.client !== null) {
      await this.client.quit();
    }
    this.client = null;
  }

  public async get<T>(
    key: string,
    defaultValue?: any,
    expired?: number,
  ): Promise<T | null> {
    let result = await this.getClient().get(key);
    if (!result && defaultValue) {
      result =
        typeof defaultValue === 'function'
          ? await defaultValue.apply(this)
          : defaultValue;
      await this.set(key, result, expired);
    }
    return result ? JSON.parse(result) : null;
  }

  public async exists(key: string): Promise<boolean> {
    const result = await this.getClient().exists(key);
    return result === 1;
  }

  public async delete(key: string): Promise<boolean> {
    const result = await this.getClient().del(key);
    return result === 1;
  }

  public async deletePrefix(prefix: string): Promise<void> {
    const keys = await this.getClient().keys(this.mergePrefix(prefix));
    await Promise.all(
      keys.map((key) => this.delete(this.removeKeyPrefix(key))),
    );
  }

  public async getByPrefix(prefix: string) {
    const keys = await this.getClient().keys(this.mergePrefix(prefix));
    const result = await Promise.all(
      keys.map((key) => this.get(this.removeKeyPrefix(key))),
    );
    return result;
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
