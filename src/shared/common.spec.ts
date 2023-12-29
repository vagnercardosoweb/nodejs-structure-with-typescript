import { randomInt } from 'node:crypto';

import { describe, expect, vi } from 'vitest';

import { Common } from '@/shared/common';
import { Env } from '@/shared/env';
import { BadRequestError } from '@/shared/errors';
import { Cnpj, Cpf } from '@/shared/values-object';

vi.mock('node:crypto', async () => {
  return {
    ...((await vi.importActual('node:crypto')) as any),
    randomBytes: vi.fn().mockReturnValue('a'),
    randomInt: vi.fn().mockResolvedValue(0),
  };
});

describe('shared/common.ts', () => {
  test('uuid', () => {
    const uuid = Common.uuid();
    expect(Common.isUuid(uuid)).toBeTruthy();
    expect(uuid).toHaveLength(36);
  });

  test('calculateAge', () => {
    let birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 38);
    expect(Common.calculateAge(birthDate)).toStrictEqual(38);

    birthDate = new Date('1994-12-15');
    expect(Common.calculateAge(birthDate)).toStrictEqual(29);

    birthDate = new Date('1992-11-05');
    expect(Common.calculateAge(birthDate)).toStrictEqual(31);

    birthDate = new Date('2018-06-16');
    expect(Common.calculateAge(birthDate)).toStrictEqual(5);
  });

  test('normalizeValue', () => {
    [
      ['1823.92', 1823.92],
      ['81237', 81237],
      ['true', true],
      ['false', false],
      ['null', null],
      ['undefined', undefined],
      ['019823', '019823'],
    ].forEach(([test, value]) =>
      expect(Common.normalizeValue(test)).toBe(value),
    );
  });

  test('dateNowToSeconds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2023, 5, 13, 0, 0, 0, 0)));
    const seconds = Common.getNowInSeconds();
    expect(seconds).toStrictEqual(1686614400);
    vi.useRealTimers();
  });

  test('ucFirst', () => {
    expect(Common.ucFirst('any value')).toEqual('Any value');
  });

  test('stripTags', () => {
    expect(Common.stripTags('<p>any value</p>')).toEqual('any value');
  });

  test('removeAccents', () => {
    expect(Common.removeAccents('àÀáÁâÂãÃäÄåÅ')).toEqual('aAaAaAaAaAaA');
    expect(Common.removeAccents('áÁéÉíÍóÓúÚ')).toEqual('aAeEiIoOuU');
  });

  test('toCamelCase', () => {
    expect(Common.toCamelCase('any value')).toEqual('anyValue');
    expect(Common.toCamelCase('Any value')).toEqual('anyValue');
  });

  test('toTitleCase', () => {
    expect(Common.toTitleCase('any value')).toEqual('Any Value');
  });

  test('isArray', () => {
    expect(Common.isArray(['a', 'b'])).toBeTruthy();
    expect(Common.isArray({ a: 'b' })).toBeFalsy();
  });

  test('isObject', () => {
    expect(Common.isObject({ a: 'b', c: 1 })).toBeTruthy();
    expect(Common.isObject(['a'])).toBeFalsy();
  });

  test('sortByAsc', () => {
    const tests = [
      { name: 'user', age: 90 },
      { name: 'user', age: 19 },
      { name: 'user', age: 39 },
      { name: 'user', age: 39 },
      { name: 'user', age: 62 },
      { name: 'user', age: 29 },
      { name: 'user', age: 23 },
    ];

    expect(Common.sortByAsc(tests, 'age')).deep.equal([
      { name: 'user', age: 19 },
      { name: 'user', age: 23 },
      { name: 'user', age: 29 },
      { name: 'user', age: 39 },
      { name: 'user', age: 39 },
      { name: 'user', age: 62 },
      { name: 'user', age: 90 },
    ]);
  });

  test('valueToBase64', () => {
    expect(Common.valueToBase64('any_value')).toEqual('YW55X3ZhbHVl');
  });

  test('base64ToValue', () => {
    expect(Common.base64ToValue('YW55X3ZhbHVl')).toEqual('any_value');
  });

  test('randomNumber', () => {
    expect(Common.randomNumber(1000, 9999)).toBeDefined();
    expect(randomInt).toHaveBeenCalledTimes(1);
    expect(randomInt).toHaveBeenCalledWith(1000, 9999);
  });

  test('removeLinesAndSpaceFromSql', () => {
    expect(
      Common.normalizeSqlQuery(`SELECT *
                                FROM users
                                WHERE 1 = 1`),
    ).toStrictEqual('SELECT * FROM users WHERE 1 = 1');
  });

  test('formatDateYYYYMMDD (UTC+0)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-07-31T21:00:00.000Z'));

    const timezone = Env.getTimezoneUtc();
    expect(timezone).toStrictEqual('UTC');

    const expected = Common.formatDateYYYYMMDD(new Date(), timezone);
    expect(expected).toStrictEqual('2023-07-31');

    vi.useRealTimers();
  });

  test('formatDateYYYYMMDD (America/Los_Angeles)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-07-31T07:00:00.000Z'));

    const expected = Common.formatDateYYYYMMDD(
      new Date(),
      'America/Los_Angeles',
    );

    expect(expected).toStrictEqual('2023-07-31');

    vi.useRealTimers();
  });

  test('formatDateYYYYMMDD (America/Sao_Paulo)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-08-01T02:59:59Z'));

    const timezone = Env.getTimezoneBrl();
    expect(timezone).toStrictEqual('America/Sao_Paulo');

    const expected = Common.formatDateYYYYMMDD(new Date(), timezone);
    expect(expected).toStrictEqual('2023-07-31');

    vi.useRealTimers();
  });

  test('parseDateFromStringWithoutTime: success', () => {
    const expected = Common.parseDateFromStringWithoutTime('2023-06-15');
    expect(expected).toStrictEqual(new Date(2023, 5, 15, 3, 0, 0, 0));
  });

  test('parseDateFromStringWithoutTime: invalid format', () => {
    const dateAsString = '2023-08-03T00:00:00Z';
    expect(() =>
      Common.parseDateFromStringWithoutTime(dateAsString),
    ).toThrowError(
      new BadRequestError({
        message: `Invalid date "${dateAsString}", only format "DD/MM/YYYY", "DD-MM-YYYY" and "YYYY-MM-DD" are allowed.`,
      }),
    );
  });

  test('parseDateFromStringWithoutTime: invalid day', () => {
    const dateAsString = '2023-02-31';
    expect(() =>
      Common.parseDateFromStringWithoutTime(dateAsString),
    ).toThrowError(
      new BadRequestError({
        message: 'The date "{{dateAsString}}" entered is not valid.',
        replaceKeys: { dateAsString },
      }),
    );
  });

  test('parseNameToParts', () => {
    const name = 'Vagner dos Santos Cardoso';
    const { firstName, middleName, lastName } = Common.parseNameToParts(name);
    expect(firstName).toEqual('Vagner');
    expect(middleName).toEqual('dos Santos');
    expect(lastName).toEqual('Cardoso');
  });

  test('isUndefined', () => {
    expect(Common.isUndefined(undefined)).toBeTruthy();
    expect(Common.isUndefined('1')).toBeFalsy();
  });

  test('removeUndefined', () => {
    const object = {
      number: 0,
      string: 'string',
      nullable: null,
      keyAsUndefined: undefined,
      nested: {
        number: 0,
        string: 'string',
        keyAsUndefined: undefined,
        arrayAsUndefined: [undefined, undefined],
        array: [1, 2],
        nested: {
          name: 'Name',
          keyAsUndefined: undefined,
        },
      },
    };

    const expected = {
      number: 0,
      string: 'string',
      nullable: null,
      nested: {
        number: 0,
        string: 'string',
        arrayAsUndefined: [null, null],
        array: [1, 2],
        nested: {
          name: 'Name',
        },
      },
    };

    expect(Common.removeUndefined(object)).toStrictEqual(expected);
  });

  test('normalizeMoneyFromString', () => {
    [
      ['R$ 1.11', 1.11],
      ['R$ 29,28', 29.28],
      ['R$ 1.982,21', 1982.21],
      ['R$ 999.761,21', 999761.21],
    ].forEach(([value, test]) => {
      expect(Common.normalizeMoneyFromString(value as string)).toBe(test);
    });
  });

  test('toDecimal', () => {
    [
      [111, 1.11],
      [2928, 29.28],
      [198221, 1982.21],
      [871029728, 8710297.28],
      [99976121, 999761.21],
    ].forEach(([value, test]) => {
      expect(Common.toDecimal(value)).toStrictEqual(test);
    });
  });

  test('toCents', () => {
    [
      [1.11, 111],
      [29.28, 2928],
      [1982.21, 198221],
      [8710297.28, 871029728],
      [999761.21, 99976121],
    ].forEach(([value, test]) => {
      expect(Common.toCents(value)).toStrictEqual(test);
    });
  });

  test('isUndefined', () => {
    expect(Common.isUndefined(undefined)).toBeTruthy();
    expect(Common.isUndefined('1')).toBeFalsy();
  });

  test('roundNumber', () => {
    expect(Common.roundNumber(1982.8712, 2)).toStrictEqual(1982.87);
    expect(Common.roundNumber(1982.8712, 4)).toStrictEqual(198287.12);
  });

  test('randomStr', () => {
    const randomStr = Common.generateRandomString(32);
    expect(randomStr).toStrictEqual('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    expect(randomStr).toHaveLength(32);
  });

  test('convertObjectKeyToLowerCase', () => {
    const input = {
      'Name': 'any',
      'X-ID-Token': 'any',
      'Authorization': 'any',
      'X-Api-Key': 'any',
    };
    const output = {
      'name': 'any',
      'x-id-token': 'any',
      'authorization': 'any',
      'x-api-key': 'any',
    };
    expect(Common.convertObjectKeyToLowerCase(input)).toStrictEqual(output);
    expect(Common.convertObjectKeyToLowerCase(input)).not.deep.equal(input);
  });

  test('rangeCharacters', () => {
    let characters = Common.rangeCharacters('a', 'z');
    expect(characters).toStrictEqual('abcdefghijklmnopqrstuvwxyz');
    characters = Common.rangeCharacters('g', 'i');
    expect(characters).toStrictEqual('ghi');
    characters = Common.rangeCharacters('a', 'g');
    expect(characters).toStrictEqual('abcdefg');
  });

  test('hashFromString', () => {
    expect(Common.hashFromString('a')).toStrictEqual(177604);
    expect(Common.hashFromString('texto mais longo')).toStrictEqual(2826721860);
    expect(Common.hashFromString('js,ts,golang')).toStrictEqual(1177950551);
    expect(Common.hashFromString('c')).toStrictEqual(177606);
  });

  test('isStatusError valida com os que retorna true', () => {
    const statusErrors = Common.rangeNumbers(199, 0);
    statusErrors.concat(Common.rangeNumbers(200, 400));
    statusErrors.forEach((s) => expect(Common.isStatusError(s)).toBeTruthy());
  });

  test('isStatusError valida os que returna false', () => {
    const statusErrors = Common.rangeNumbers(200, 200);
    statusErrors.forEach((s) => expect(Common.isStatusError(s)).toBeFalsy());
  });

  test('cloneObject', () => {
    const object = { name: 'vagner', age: 29 };
    const clone = Common.cloneObject(object);
    clone.name = 'vagner cardoso';
    clone.age = 30;
    expect(clone.name).toStrictEqual('vagner cardoso');
    expect(clone.age).toStrictEqual(30);
    expect(object.name).toStrictEqual('vagner');
    expect(object.age).toStrictEqual(29);
  });

  test('onlyNumber', () => {
    for (let i = 0; i < 50; i += 1) {
      const cpf = Cpf.generate();
      expect(Common.onlyNumber(cpf.format())).toEqual(cpf.toString());
    }

    for (let i = 0; i < 50; i += 1) {
      const cnpj = Cnpj.generate();
      expect(Common.onlyNumber(cnpj.format())).toEqual(cnpj.toString());
    }
  });

  test('parseDate', () => {
    const validDates: Record<string, Date> = {
      '01/01/2023': new Date(2023, 0, 1, 3, 0, 0, 0),
      '07-02-2023': new Date(2023, 1, 7, 3, 0, 0, 0),
      '2023-07-02': new Date(2023, 6, 2, 3, 0, 0, 0),
      '2023-02-28': new Date(2023, 1, 28, 3, 0, 0, 0),
      '2016-02-29': new Date(2016, 1, 29, 3, 0, 0, 0),
    };

    for (const key in validDates) {
      const value = Common.parseDateFromStringWithoutTime(key);
      expect(value).toStrictEqual(validDates[key]);
    }

    const invalidDates = ['invalid', '2023-02-29'];
    for (const date of invalidDates) {
      expect(() => Common.parseDateFromStringWithoutTime(date)).toThrowError();
    }
  });
});
