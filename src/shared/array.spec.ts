import { describe, it } from 'vitest';

import { generateChunks, isArray, sortByAsc, sortByDesc } from '@/shared/array';

describe('src/shared/utils/array', () => {
  it.each([
    [[1, 2, 3, 4, 5], 2, [[1, 2], [3, 4], [5]]],
    [
      [1, 2, 3, 4, 5],
      3,
      [
        [1, 2, 3],
        [4, 5],
      ],
    ],
    [[1, 2, 3, 4, 5], 4, [[1, 2, 3, 4], [5]]],
    [[1, 2, 3, 4, 5], 5, [[1, 2, 3, 4, 5]]],
    [[1, 2, 3, 4, 5], 6, [[1, 2, 3, 4, 5]]],
    [[1, 2, 3, 4, 5], 1, [[1], [2], [3], [4], [5]]],
  ])(
    'generateChunks("%s", "%s") should return "%s"',
    (array, size, expected) => {
      expect(Array.from(generateChunks(array, size))).toEqual(expected);
    },
  );

  it('generateChunks should throw an error if size is 0', () => {
    expect(() => Array.from(generateChunks([1, 2, 3], 0))).toThrowError(
      'Size must be greater than 0',
    );
  });

  it('isArray should return true if value is an array', () => {
    expect(isArray([1, 2, 3])).toBe(true);
    expect(isArray([])).toBe(true);
    expect(isArray([1])).toBe(true);
  });

  it('isArray should return false if value is not an array', () => {
    expect(isArray({})).toBe(false);
    expect(isArray('')).toBe(false);
    expect(isArray(1)).toBe(false);
    expect(isArray(true)).toBe(false);
    expect(isArray(false)).toBe(false);
    expect(isArray(null)).toBe(false);
    expect(isArray(undefined)).toBe(false);
  });

  it.each([
    [
      [{ name: 'John' }, { name: 'Mary' }, { name: 'Peter' }],
      'name',
      [{ name: 'John' }, { name: 'Mary' }, { name: 'Peter' }],
    ],
    [
      [{ name: 'Mary' }, { name: 'John' }, { name: 'Peter' }],
      'name',
      [{ name: 'John' }, { name: 'Mary' }, { name: 'Peter' }],
    ],
    [
      [{ timestamp: 1 }, { timestamp: 3 }, { timestamp: 2 }],
      'timestamp',
      [{ timestamp: 1 }, { timestamp: 2 }, { timestamp: 3 }],
    ],
    [
      [{ item: 'a' }, { item: 'c' }, { item: 'b' }],
      'item',
      [{ item: 'a' }, { item: 'b' }, { item: 'c' }],
    ],
  ])(
    'sortByAsc("%s", "%s") should return "%s"',
    (array: any[], column, expected) => {
      expect(sortByAsc(array, column)).toEqual(expected);
    },
  );

  it.each([
    [
      [{ name: 'John' }, { name: 'Mary' }, { name: 'Peter' }],
      'name',
      [{ name: 'Peter' }, { name: 'Mary' }, { name: 'John' }],
    ],
    [
      [{ name: 'Mary' }, { name: 'John' }, { name: 'Peter' }],
      'name',
      [{ name: 'Peter' }, { name: 'Mary' }, { name: 'John' }],
    ],
    [
      [{ timestamp: 1 }, { timestamp: 3 }, { timestamp: 2 }],
      'timestamp',
      [{ timestamp: 3 }, { timestamp: 2 }, { timestamp: 1 }],
    ],
    [
      [{ item: 'a' }, { item: 'c' }, { item: 'b' }],
      'item',
      [{ item: 'c' }, { item: 'b' }, { item: 'a' }],
    ],
  ])(
    'sortByDesc("%s", "%s") should return "%s"',
    (array: any[], column, expected) => {
      expect(sortByDesc(array, column)).toEqual(expected);
    },
  );
});
