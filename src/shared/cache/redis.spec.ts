import IORedis from 'ioredis';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

import { Logger, RedisCache } from '@/shared';

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
    cacheClient = new RedisCache({} as any);
    redisClient = new IORedis() as any;
  });

  it('deveria conectar com sucesso', async () => {
    await expect(cacheClient.connect()).resolves.toBeTruthy();
    expect(redisClient.connect).toHaveBeenCalledTimes(1);
    expect((cacheClient as any).connected).toBeTruthy();
  });

  it('deveria executar apenas 1x a conexão', async () => {
    await cacheClient.connect();
    await cacheClient.connect();
    expect(redisClient.connect).toHaveBeenCalledTimes(1);
  });

  it('deveria fechar a conexão com sucesso', async () => {
    await cacheClient.connect();
    await expect(cacheClient.close()).resolves;
    expect(redisClient.quit).toHaveBeenCalledTimes(1);
    expect((cacheClient as any).connected).toBeFalsy();
  });

  it('deveria executar apenas 1x o fechamento da conexão', async () => {
    await cacheClient.connect();
    await cacheClient.close();
    await cacheClient.close();
    expect(redisClient.quit).toHaveBeenCalledTimes(1);
  });

  it('deveria criar uma instância com ":" no final do prefix', () => {
    cacheClient = new RedisCache({ keyPrefix: 'cache:' } as any);
    expect((cacheClient as any).keyPrefix).toStrictEqual('cache:');
  });

  it('deveria criar uma instância com base nas variáveis de ambiente', () => {
    expect(() => RedisCache.fromEnvironment()).not.toThrow();
  });

  it(`deveria recuperar um cache com uma chave que não existe e retornar null`, () => {
    redisClient.get.mockResolvedValue(null);
    expect(cacheClient.get('any_key')).resolves.toBe(null);
    expect(redisClient.get).toHaveBeenCalledTimes(1);
  });

  it(`deveria recuperar um cache existente`, () => {
    redisClient.get.mockResolvedValue(JSON.stringify(testValues[7]));
    expect(cacheClient.get('key')).resolves.toStrictEqual(testValues[7]);
    expect(redisClient.get).toHaveBeenCalledTimes(1);
  });

  it('deveria limpar todo cache com sucesso', async () => {
    redisClient.flushdb.mockResolvedValue('OK');
    await expect(cacheClient.clear()).resolves.toBeTruthy();
    expect(redisClient.flushdb).toHaveBeenCalledTimes(1);
  });

  it('deveria retornar false ao recuperar um cache que não existe', async () => {
    redisClient.exists.mockResolvedValue(0);
    await expect(cacheClient.has('key')).resolves.toBeFalsy();
    expect(redisClient.exists).toHaveBeenCalledWith('key');
    expect(redisClient.exists).toHaveBeenCalledTimes(1);
  });

  it('deveria retornar true ao recuperar um cache que existe', async () => {
    redisClient.exists.mockResolvedValue(1);
    await expect(cacheClient.has('key')).resolves.toBeTruthy();
  });

  it('deveria retornar true ao remover um cache que existe', async () => {
    redisClient.del.mockResolvedValue(1);
    await expect(cacheClient.delete('key')).resolves.toBeTruthy();
    expect(redisClient.del).toHaveBeenCalledWith('key');
    expect(redisClient.del).toHaveBeenCalledTimes(1);
  });

  it('deveria retornar false ao remover um cache que não existe', async () => {
    redisClient.del.mockResolvedValue(1);
    await expect(cacheClient.delete('key')).resolves.toBeTruthy();
  });

  it('deveria remover o cache com base em um prefix', async () => {
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

  it('deveria recupera valores com prefix na chave do cache', async () => {
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

  it(`deveria configurar um cache com expiração`, async () => {
    await cacheClient.set('any_key', testValues[0], 60);

    expect(redisClient.set).toHaveBeenCalledTimes(1);
    expect(redisClient.set).toHaveBeenCalledWith(
      'any_key',
      JSON.stringify(testValues[0]),
      'EX',
      60,
    );
  });

  it('deveria criar uma instância do cache com outro logger id', () => {
    const clone = cacheClient.withLogger(Logger.withId('other_id'));
    expect((clone as any).logger.id).toStrictEqual('other_id');
    expect(clone).not.toStrictEqual(cacheClient);
  });

  for (let value of testValues) {
    const valueType = Object.prototype.toString.call(value);

    it(`deveria recuperar um cache com uma chave que não existe com tipo de dados: ${valueType}`, async () => {
      redisClient.get.mockResolvedValue(null);

      const result = await cacheClient.get('key', value);
      if (typeof value === 'function') value = value();
      expect(result).toStrictEqual(value);

      expect(redisClient.get).toHaveBeenCalledTimes(1);
      expect(redisClient.get).toHaveBeenCalledWith('key');
    });

    it(`deveria criar um cache e retornar o mesmo valor com o tipo de dados: ${valueType}`, async () => {
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
