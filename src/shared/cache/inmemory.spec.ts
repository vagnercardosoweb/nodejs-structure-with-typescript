import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InMemoryCache } from '@/shared';

describe('InMemoryCache', () => {
  let inMemoryCache: InMemoryCache;
  const testValues = [
    'string',
    true,
    false,
    null,
    [1, 2, 3],
    ['1', '2', '3'],
    { key: 'value' },
    [{ key: 'value' }],
    new (class Test {})(),
    () => 'fn',
    Symbol('test'),
    new Set(['t', 'u', 'd']),
    new Map([
      ['a', 1],
      ['b', 2],
    ]),
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 3, 8, 0, 0, 0, 0));

    inMemoryCache = new InMemoryCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deveria criar uma instância do cache vazia', () => {
    expect((inMemoryCache as any).cached.size).toBe(0);
  });

  it('deveria criar uma instância do cache com outro logger id', () => {
    expect(inMemoryCache.withLoggerId('test')).toStrictEqual(inMemoryCache);
  });

  it('deveria limpar todo cache', async () => {
    await inMemoryCache.set('any_key', 'any_value');
    expect((inMemoryCache as any).cached.size).toBe(1);
    await inMemoryCache.clear();
    expect((inMemoryCache as any).cached.size).toBe(0);
  });

  it('deveria criar um novo cache sem passar os segundos de expiração', async () => {
    const spyMapSet = vi.spyOn((inMemoryCache as any).cached, 'set');

    await inMemoryCache.set('any_key', 'any_value');
    await expect(inMemoryCache.get('any_key')).resolves.toEqual('any_value');

    expect(spyMapSet).toHaveBeenCalledTimes(1);
    expect(spyMapSet).toHaveBeenCalledWith('any_key', {
      expires: -1,
      value: 'any_value',
    });
  });

  it('deveria recuperar um cache com uma chave que não existe e usar o valor padrão com base em uma função', async () => {
    const spySet = vi.spyOn(inMemoryCache, 'set');
    const spyFn = vi.fn().mockReturnValue('any_value');

    const result = await inMemoryCache.get('any_key', spyFn);
    expect(result).toEqual('any_value');

    expect(spySet).toHaveBeenCalledTimes(1);
    expect(spySet).toHaveBeenCalledWith('any_key', 'any_value', undefined);

    expect(spyFn).toHaveBeenCalledTimes(1);
  });

  it('deveria criar um cache com segundos de expiração', async () => {
    const spyMapSet = vi.spyOn((inMemoryCache as any).cached, 'set');
    await inMemoryCache.set('any_key', 'any_value', 60);

    expect(spyMapSet).toHaveBeenCalledTimes(1);
    expect(spyMapSet).toHaveBeenCalledWith('any_key', {
      expires: Date.now() + 60,
      value: 'any_value',
    });
  });

  it('deveria recuperar um cache expirado', async () => {
    const apyMapDelete = vi.spyOn((inMemoryCache as any).cached, 'delete');

    await inMemoryCache.set('any_key', 'any_value', 1);
    vi.advanceTimersByTime(2000);

    await expect(inMemoryCache.get('any_key')).resolves.toEqual(null);

    expect(apyMapDelete).toHaveBeenCalledTimes(1);
    expect(apyMapDelete).toHaveBeenCalledWith('any_key');
  });

  it('deveria retornar TRUE se uma chave de cache existir', async () => {
    await inMemoryCache.set('any_key', 'any_value');
    await expect(inMemoryCache.has('any_key')).resolves.toBeTruthy();
    expect((inMemoryCache as any).cached.size).toBe(1);
  });

  it('deveria retornar FALSE se uma chave de cache não existir', async () => {
    await expect(inMemoryCache.has('not_exist_key')).resolves.toBeFalsy();
    expect((inMemoryCache as any).cached.size).toBe(0);
  });

  it('deveria retornar TRUE ao remover um cache existente', async () => {
    await inMemoryCache.set('any_key', 'any_value');
    await expect(inMemoryCache.delete('any_key')).resolves.toBeTruthy();
    expect((inMemoryCache as any).cached.size).toBe(0);
  });

  it('deveria retornar FALSE ao remover um cache existente', async () => {
    await inMemoryCache.set('any_key', 'any_value');
    await expect(inMemoryCache.delete('not_exist_key')).resolves.toBeFalsy();
  });

  for (let testValue of testValues) {
    const valueType = Object.prototype.toString.call(testValue);

    it(`deveria recuperar um cache com uma chave que não existe com tipo de dados: ${valueType}`, async () => {
      const result = await inMemoryCache.get('any_key', testValue);
      if (typeof testValue === 'function') testValue = testValue();
      expect(result).toStrictEqual(testValue);
    });

    it(`deveria criar um cache e retornar o mesmo valor com o tipo de dados: ${valueType}`, async () => {
      await inMemoryCache.set('any_key', testValue);
      await expect(inMemoryCache.get('any_key')).resolves.toStrictEqual(
        testValue,
      );
    });
  }
});
