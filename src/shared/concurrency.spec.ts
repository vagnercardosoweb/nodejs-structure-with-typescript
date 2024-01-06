import { setTimeout } from 'node:timers/promises';

import { describe, expect, test } from 'vitest';

import { concurrency, go } from '@/shared/concurrency';
import { Env } from '@/shared/env';

describe.skipIf(Env.get('CI'))('shared/concurrency.ts', () => {
  test('can execute one function with limit 1', async () => {
    const limit1 = concurrency(1);
    const res: number[] = [];
    const create = (value: number) => async () => {
      res.push(value);
    };
    await limit1(create(123));
    expect(res).toStrictEqual([123]);
    await limit1(create(456));
    expect(res).toStrictEqual([123, 456]);
    await Promise.all([limit1(create(1)), limit1(create(2))]);
    expect(res).toStrictEqual([123, 456, 1, 2]);
  });

  test('should give an error when executing a task and rejecting it', async () => {
    const limit1 = concurrency(1);
    const code = async () => {
      throw new Error();
    };
    await expect(limit1(code)).rejects.toThrow();
  });

  test('should run the [go] function with a code that will give an error', () => {
    go(async () => {
      throw new Error();
    });
  });

  test('can execute one function with limit 10', async () => {
    const limit10 = concurrency(10);
    const res: number[] = [];
    const create = (value: number) => async () => {
      res.push(value);
    };
    await limit10(create(123));
    expect(res).toStrictEqual([123]);
    await limit10(create(456));
    expect(res).toStrictEqual([123, 456]);
    await Promise.all([limit10(create(1))]);
    expect(res).toStrictEqual([123, 456, 1]);
  });

  describe('limits concurrency to 1', () => {
    for (let i = 0; i < 10; i++) {
      test(`${i + 1}`, async () => {
        const limit1 = concurrency(1);
        const res: number[] = [];
        const create = (value: number) => async () => {
          await setTimeout(Math.round(Math.random() * 10) + 1);
          res.push(value);
        };
        await Promise.all([
          limit1(create(1)),
          limit1(create(2)),
          limit1(create(3)),
          limit1(create(4)),
          limit1(create(5)),
        ]);
        expect(res).toStrictEqual([1, 2, 3, 4, 5]);
      });
    }
  });

  describe('check concurrency in-flight', () => {
    for (let limit = 1; limit <= 6; limit++) {
      describe(`limits concurrency to ${limit}`, () => {
        for (let i = 0; i < 10; i++) {
          test(`${i + 1}`, async () => {
            const limiter = concurrency(limit);
            const running: boolean[] = [];
            const assert = async () => {
              const count = running.filter(Boolean).length;
              if (count > limit) throw new Error('Too many running');
            };
            const create = (index: number) => {
              running[index] = false;
              return async () => {
                running[index] = true;
                await assert();
                await setTimeout(Math.round(Math.random() * 10) + 1);
                await assert();
                running[index] = false;
              };
            };
            const promises: Promise<any>[] = [];
            for (let i = 0; i < limit * 2; i++) {
              promises.push(limiter(create(i)));
            }
            await Promise.all(promises);
          });
        }
      });
    }
  });

  describe('check execution order', () => {
    for (let limit = 1; limit <= 6; limit++) {
      describe(`limits concurrency to ${limit}`, () => {
        for (let i = 0; i < 10; i++) {
          test(`${i + 1}`, async () => {
            const limiter = concurrency(limit);
            let expectedIndex = 0;
            const create = (index: number) => {
              return async () => {
                if (index !== expectedIndex) throw new Error('Wrong order');
                expectedIndex++;
                await setTimeout(Math.round(Math.random() * 10) + 1);
              };
            };
            const promises: Promise<any>[] = [];
            for (let i = 0; i < limit * 2; i++) {
              promises.push(limiter(create(i)));
            }
            await Promise.all(promises);
          });
        }
      });
    }
  });
});
