import { describe } from 'vitest';

import {
  isEmptyValue,
  isUndefined,
  jsonParseOrDefault,
  normalizeValue,
  removeUndefined,
  until,
} from '@/shared/utils';

describe('src/shared/utils/utils', () => {
  it('isUndefined should return true', () => {
    expect(isUndefined(undefined)).toBe(true);
  });

  it('isUndefined should return false', () => {
    expect(isUndefined('undefined')).toBe(false);
  });

  it('removeUndefined should return object without undefined', () => {
    const obj = { a: 1, b: undefined };
    expect(removeUndefined(obj)).toEqual({ a: 1 });
  });

  it('normalizeValue should return number', () => {
    expect(normalizeValue(1)).toBe(1);
    expect(normalizeValue('1')).toBe(1);
    expect(normalizeValue('1.1')).toBe(1.1);
    expect(normalizeValue('1.1.1')).toBe('1.1.1');
    expect(normalizeValue('01')).toBe('01');
    expect(normalizeValue('true')).toBe(true);
    expect(normalizeValue('false')).toBe(false);
    expect(normalizeValue('undefined')).toBe(undefined);
    expect(normalizeValue('null')).toBe(null);
  });

  it('jsonParseOrDefault should return correct values', () => {
    expect(jsonParseOrDefault({ a: 1 })).toEqual({ a: 1 });
    expect(jsonParseOrDefault('{"a":1}')).toEqual({ a: 1 });

    expect(jsonParseOrDefault('invalid_json', {})).toEqual({});
    expect(jsonParseOrDefault('invalid_json', { a: 'b' })).toEqual({ a: 'b' });

    expect(jsonParseOrDefault('')).toBe('');
    expect(jsonParseOrDefault(undefined)).toBe(undefined);
    expect(jsonParseOrDefault(null)).toBe(null);

    expect(() => jsonParseOrDefault('invalid_json')).toThrowError(
      'Unexpected token \'i\', "invalid_json" is not valid JSON',
    );

    expect(
      jsonParseOrDefault(new Uint8Array([123, 34, 97, 34, 58, 49, 125])),
    ).toEqual({ a: 1 });
  });

  it('until should return true', async () => {
    let count = 0;
    const condition = async () => {
      count++;
      return count === 3;
    };
    await until(condition);
    expect(count).toBe(3);
  });

  it('isEmptyValue should return true', () => {
    expect(isEmptyValue(undefined)).toBe(true);
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue('')).toBe(true);
    expect(isEmptyValue([])).toBe(true);
    expect(isEmptyValue({})).toBe(true);
  });
});
