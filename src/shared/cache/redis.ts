import IORedis from 'ioredis';

import { CacheDefaultValue, CacheInterface } from '@/shared/cache';
import { Env } from '@/shared/env';
import { LoggerInterface } from '@/shared/logger';
import { cloneObject } from '@/shared/object';

type Options = {
  port: number;
  host: string;
  password?: string;
  username?: string;
  keyPrefix?: string;
  db?: number;
};

export class RedisCache implements CacheInterface {
  protected client: IORedis;
  protected readonly keyPrefix: string;
  protected connected = false;

  public constructor(
    protected logger: LoggerInterface,
    protected readonly options: Options,
  ) {
    this.keyPrefix = this.getKeyPrefix();
    this.client = new IORedis({
      port: this.options.port,
      host: this.options.host,
      password: this.options.password,
      db: this.options.db,
      username: this.options.username,
      keyPrefix: this.keyPrefix,
      lazyConnect: true,
    });
  }

  public static fromEnvironment(logger: LoggerInterface): RedisCache {
    return new RedisCache(logger, {
      port: Env.required('REDIS_PORT'),
      host: Env.required('REDIS_HOST'),
      password: Env.get('REDIS_PASSWORD'),
      username: Env.get('REDIS_USERNAME'),
      keyPrefix: Env.get('REDIS_KEY_PREFIX'),
      db: Env.get('REDIS_DATABASE', 0),
    });
  }

  public withLogger(logger: LoggerInterface): CacheInterface {
    const clone = cloneObject(this);
    clone.logger = logger;
    return clone;
  }

  public getLogger(): LoggerInterface {
    return this.logger;
  }

  public async clear(): Promise<boolean> {
    const result = await this.client.flushdb();
    return result === 'OK';
  }

  public async connect(): Promise<RedisCache> {
    if (this.connected) return this;
    this.logger.info('redis connection');
    await this.client.connect();
    this.connected = true;
    return this;
  }

  public async set<T>(key: string, value: T, expireInSeconds?: number) {
    const valueToString = JSON.stringify(value);
    if (expireInSeconds) {
      await this.client.set(key, valueToString, 'EX', expireInSeconds);
    } else {
      await this.client.set(key, valueToString);
    }
  }

  public async close(): Promise<void> {
    if (!this.connected) return;
    this.logger.info('redis closing');
    await this.client.quit();
    this.connected = false;
  }

  public async get<T>(
    key: string,
    defaultValue?: CacheDefaultValue<T>,
    expireInSeconds?: number,
  ): Promise<T | null> {
    let result = await this.client.get(key);
    if (!result && defaultValue !== undefined) {
      result =
        typeof defaultValue === 'function'
          ? await defaultValue()
          : defaultValue;
      await this.set(key, result, expireInSeconds);
      return result as T;
    }
    return result !== null ? JSON.parse(result) : null;
  }

  public async has(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result > 0;
  }

  public async delete(key: string): Promise<boolean> {
    const result = await this.client.del(key);
    return result > 0;
  }

  public async deleteByPrefix(prefix: string): Promise<void> {
    const keys = await this.client.keys(this.mergePrefix(prefix));
    await Promise.all(keys.map((key) => this.delete(this.removeByPrefix(key))));
  }

  public async getByPrefix(prefix: string) {
    const keys = await this.client.keys(this.mergePrefix(prefix));
    return Promise.all(keys.map((key) => this.get(this.removeByPrefix(key))));
  }

  protected removeByPrefix(prefix: string): string {
    return prefix.replace(this.keyPrefix, '');
  }

  protected getKeyPrefix() {
    let prefix = this.options?.keyPrefix?.trim() ?? 'cache:';
    if (prefix?.length && !prefix.endsWith(':')) prefix = `${prefix}:`;
    return prefix;
  }

  protected mergePrefix(prefix: string): string {
    return `${this.keyPrefix}${prefix}`;
  }
}
