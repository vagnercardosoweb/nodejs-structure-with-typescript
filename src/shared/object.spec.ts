import { describe } from 'vitest';

import {
  cloneObject,
  convertDeepKeyToLowerCase,
  convertKeyToLowerCase,
  isObject,
} from '@/shared/object';

describe('src/shared/utils/object', () => {
  it('isObject should return true if value is an object', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });

  it('isObject should return false if value is not an object', () => {
    expect(isObject([])).toBe(false);
    expect(isObject(1)).toBe(false);
    expect(isObject('')).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
  });

  it('cloneObject should return a new object', () => {
    const original = { a: 1 };
    const clone = cloneObject(original);
    expect(clone).not.toBe(original);
    expect(clone).toEqual(original);
  });

  it('convertKeyToLowerCase should return a new object with all keys in lower case', () => {
    const original = { A: 1, b: 2, C: 3 };
    const converted = { a: 1, b: 2, c: 3 };
    expect(convertKeyToLowerCase(original)).toEqual(converted);
  });

  it('convertDeepKeyToLowerCase should return a new object with all keys in lower case', () => {
    const original = Object.freeze({
      A: 1,
      b: 2,
      C: 3,
      D: {
        E: 4,
        F: 5,
        G: {
          H: 6,
          I: {
            J: 7,
          },
        },
      },
      K: [8, 9, 10],
      Z: [
        {
          A: 1,
          B: 2,
          C: 3,
          D: {
            E: 4,
            F: 5,
            G: {
              H: 6,
              I: {
                J: 7,
              },
            },
          },
        },
      ],
    });

    const converted = {
      a: 1,
      b: 2,
      c: 3,
      d: {
        e: 4,
        f: 5,
        g: {
          h: 6,
          i: {
            j: 7,
          },
        },
      },
      k: [8, 9, 10],
      z: [
        {
          a: 1,
          b: 2,
          c: 3,
          d: {
            e: 4,
            f: 5,
            g: {
              h: 6,
              i: {
                j: 7,
              },
            },
          },
        },
      ],
    };

    expect(convertDeepKeyToLowerCase(original)).toEqual(converted);
  });
});
