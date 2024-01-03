import IORedis from 'ioredis';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

import { RedisCache } from '@/shared/cache';
import { Logger } from '@/shared/logger';

vi.mock('ioredis', () => {
  const client = vi.fn();
  client.prototype.get = vi.fn();
  client.prototype.exists = vi.fn();
  client.prototype.flushdb = vi.fn();
  client.prototype.connect = vi.fn();
  client.prototype.quit = vi.fn();
  client.prototype.keys = vi.fn();
  client.prototype.del = vi.fn();
  client.prototype.set = vi.fn();
  return { default: client };
});

describe('shared/cache/redis', () => {
  let cacheClient: RedisCache;
  const logger = new Logger('test');
  let redisClient: Mocked<IORedis>;

  const testValues = [
    'string',
    true,
    false,
    null,
    [1, 2, 3],
    ['1', '2', '3'],
    { key: 'value' },
    [{ key: 'value' }],
    () => 'fn',
  ];

  beforeEach(() => {
    cacheClient = new RedisCache(logger, {} as any);
    redisClient = new IORedis() as any;
  });

  it('should connect successfully', async () => {
    await expect(cacheClient.connect()).resolves.toBeTruthy();
    expect(redisClient.connect).toHaveBeenCalledTimes(1);
    expect((cacheClient as any).connected).toBeTruthy();
  });

  it('should only perform 1x connection', async () => {
    await cacheClient.connect();
    await cacheClient.connect();
    expect(redisClient.connect).toHaveBeenCalledTimes(1);
  });

  it('should close the connection successfully', async () => {
    await cacheClient.connect();
    await expect(cacheClient.close()).resolves;
    expect(redisClient.quit).toHaveBeenCalledTimes(1);
    expect((cacheClient as any).connected).toBeFalsy();
  });

  it('should only close the connection once', async () => {
    await cacheClient.connect();
    await cacheClient.close();
    await cacheClient.close();
    expect(redisClient.quit).toHaveBeenCalledTimes(1);
  });

  it('should create an instance with ":" at the end of the prefix', () => {
    cacheClient = new RedisCache(logger, { keyPrefix: 'cache:' } as any);
    expect((cacheClient as any).keyPrefix).toStrictEqual('cache:');
  });

  it('should create an instance based on environment variables', () => {
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    expect(() => RedisCache.fromEnvironment(logger)).not.toThrow();
  });

  it(`should retrieve a cache with a key that doesn't exist and return "null"`, () => {
    redisClient.get.mockResolvedValue(null);
    expect(cacheClient.get('any_key')).resolves.toBe(null);
    expect(redisClient.get).toHaveBeenCalledTimes(1);
  });

  it('should retrieve an existing cache', () => {
    redisClient.get.mockResolvedValue(JSON.stringify(testValues[7]));
    expect(cacheClient.get('key')).resolves.toStrictEqual(testValues[7]);
    expect(redisClient.get).toHaveBeenCalledTimes(1);
  });

  it('should clear all cache successfully', async () => {
    redisClient.flushdb.mockResolvedValue('OK');
    await expect(cacheClient.clear()).resolves.toBeTruthy();
    expect(redisClient.flushdb).toHaveBeenCalledTimes(1);
  });

  it('should return false when retrieving a cache that does not exist', async () => {
    redisClient.exists.mockResolvedValue(0);
    await expect(cacheClient.has('key')).resolves.toBeFalsy();
    expect(redisClient.exists).toHaveBeenCalledWith('key');
    expect(redisClient.exists).toHaveBeenCalledTimes(1);
  });

  it('should return true when retrieving a cache that exists', async () => {
    redisClient.exists.mockResolvedValue(1);
    await expect(cacheClient.has('key')).resolves.toBeTruthy();
  });

  it('should return true when removing a cache that exists', async () => {
    redisClient.del.mockResolvedValue(1);
    await expect(cacheClient.delete('key')).resolves.toBeTruthy();
    expect(redisClient.del).toHaveBeenCalledWith('key');
    expect(redisClient.del).toHaveBeenCalledTimes(1);
  });

  it('should return false when removing a cache that does not exist', async () => {
    redisClient.del.mockResolvedValue(1);
    await expect(cacheClient.delete('key')).resolves.toBeTruthy();
  });

  it('should remove cache based on a prefix', async () => {
    const keys = ['key:1', 'key:2'];
    redisClient.keys.mockResolvedValue(keys.map((k) => `cache:${k}`));
    await cacheClient.deleteByPrefix('key:*');

    expect(redisClient.keys).toHaveBeenCalledTimes(1);
    expect(redisClient.keys).toHaveBeenCalledWith('cache:key:*');

    expect(redisClient.del).toHaveBeenCalledTimes(keys.length);

    keys.forEach((key) => {
      expect(redisClient.del).toHaveBeenCalledWith(key);
    });
  });

  it('should retrieve values with prefix in the cache key', async () => {
    const keys = ['key:1', 'key:2'];
    redisClient.keys.mockResolvedValue(keys.map((k) => `cache:${k}`));

    const results = await cacheClient.getByPrefix('key:*');
    expect(results).toHaveLength(2);

    expect(redisClient.keys).toHaveBeenCalledTimes(1);
    expect(redisClient.keys).toHaveBeenCalledWith('cache:key:*');

    expect(redisClient.get).toHaveBeenCalledTimes(keys.length);

    keys.forEach((key) => {
      expect(redisClient.get).toHaveBeenCalledWith(key);
    });
  });

  it('should configure an expiring cache', async () => {
    await cacheClient.set('any_key', testValues[0], 60);

    expect(redisClient.set).toHaveBeenCalledTimes(1);
    expect(redisClient.set).toHaveBeenCalledWith(
      'any_key',
      JSON.stringify(testValues[0]),
      'EX',
      60,
    );
  });

  it('should create a cache instance with another logger id', () => {
    const clone = cacheClient.withLogger(new Logger('other_id'));
    expect((clone as any).logger.id).toStrictEqual('other_id');
    expect(clone).not.toStrictEqual(cacheClient);
  });

  it('should return the logger instance', () => {
    expect(cacheClient.getLogger()).toBeInstanceOf(Logger);
  });

  for (let value of testValues) {
    const valueType = Object.prototype.toString.call(value);

    it(`should retrieve a cache with a key that does not exist with data type "${valueType}"`, async () => {
      redisClient.get.mockResolvedValue(null);

      const result = await cacheClient.get('key', value);
      if (typeof value === 'function') value = value();
      expect(result).toStrictEqual(value);

      expect(redisClient.get).toHaveBeenCalledTimes(1);
      expect(redisClient.get).toHaveBeenCalledWith('key');
    });

    it(`should create a cache and return the same value with the data type "${valueType}"`, async () => {
      await cacheClient.set('key', value);

      expect(redisClient.set).toHaveBeenCalledTimes(1);
      expect(redisClient.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify(value),
      );

      if (typeof value === 'function') value = value();

      redisClient.get.mockResolvedValue(JSON.stringify(value));
      await expect(cacheClient.get('key')).resolves.toStrictEqual(value);
    });
  }
});
