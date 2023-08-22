import IORedis from 'ioredis';

import { Env, Logger, LoggerInterface, Utils } from '@/shared';

import { CacheDefaultValue, CacheInterface } from './cache';

type Options = {
  port: number;
  host: string;
  password?: string;
  username?: string;
  keyPrefix?: string;
  db?: number;
};

export class RedisCache implements CacheInterface {
  private client: IORedis;
  private readonly keyPrefix: string = 'cache';
  private connected = false;
  private logger: LoggerInterface;

  public constructor(options: Options) {
    this.logger = Logger.withId('REDIS');

    const prefix = options?.keyPrefix?.trim() ?? this.keyPrefix;
    this.keyPrefix = this.normalizeKeyPrefix(prefix);

    this.client = new IORedis({
      port: options.port,
      host: options.host,
      password: options.password,
      db: options.db,
      username: options.username,
      keyPrefix: this.keyPrefix,
      lazyConnect: true,
    });
  }

  public static fromEnvironment(): RedisCache {
    return new RedisCache({
      port: Env.required('REDIS_PORT'),
      host: Env.required('REDIS_HOST'),
      password: Env.get('REDIS_PASSWORD'),
      username: Env.get('REDIS_USERNAME'),
      keyPrefix: Env.get('REDIS_KEY_PREFIX'),
      db: Env.get('REDIS_DATABASE', 0),
    });
  }

  public withLoggerId(id: string): CacheInterface {
    const clone = Utils.cloneObject(this);
    clone.logger = this.logger.withId(id);
    return clone;
  }

  public async clear(): Promise<boolean> {
    const result = await this.client.flushdb();
    return result === 'OK';
  }

  public async connect(): Promise<RedisCache> {
    if (this.connected) return this;
    this.logger.info('CONNECTING');
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
    this.logger.info('CLOSING');
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

  private removeByPrefix(prefix: string): string {
    return prefix.replace(this.keyPrefix, '');
  }

  private normalizeKeyPrefix(prefix: string): string {
    if (prefix?.length && !prefix.endsWith(':')) return `${prefix}:`;
    return prefix;
  }

  private mergePrefix(prefix: string): string {
    return `${this.keyPrefix}${prefix}`;
  }
}
