import { randomInt } from 'node:crypto';

import { describe, expect, vi } from 'vitest';

import * as constants from '@/config/constants';
import { BadRequestError, Cnpj, Cpf, Env } from '@/shared';

import { Utils } from './utils';

vi.mock('node:crypto', async () => {
  return {
    ...((await vi.importActual('node:crypto')) as any),
    randomBytes: vi.fn().mockReturnValue('a'),
    randomInt: vi.fn().mockResolvedValue(0),
  };
});

const createObjectObfuscate = () => {
  const imageBase64 =
    'data:image/jpeg;base64,H4sICPsdulsCAHJlYWRtZS50eHQAC0/NSc7PTVUoyVdISixONTPRSy8tKlUEAPCdUNYXAAAA';
  return Object.freeze({
    name: 'any_name',
    password: 'any_password',
    email: 'any_mail@mail.com',
    undefinedValue: undefined,
    nullValue: null,
    testObject: {
      name: 'any_name',
      password: 'any_password',
      email: 'any_mail@mail.com',
    },
    nestedObject: {
      name: 'any_name',
      password: 'any_password',
      credentials: {
        password: 'any_password',
      },
    },
    arrayAsString: ['one', 'two'],
    arrayAsNumber: [1, 2],
    arrayAsObject: [
      {
        name: 'any_name',
        email: 'any_mail@mail.com',
        password: 'any_password',
      },
      {
        name: 'any_name_2',
        email: 'any_mail_2@mail.com',
        password: 'any_password_2',
      },
    ],
    images: {
      document_front: imageBase64,
      document_back: imageBase64,
      facematch: imageBase64,
      liveness: [imageBase64, imageBase64, imageBase64],
    },
  });
};

const createObjectModifiedObfuscate = () =>
  Object.freeze({
    name: 'any_name',
    email: 'any_mail@mail.com',
    password: constants.REDACTED_TEXT,
    nullValue: null,
    testObject: constants.REDACTED_TEXT,
    nestedObject: {
      name: 'any_name',
      password: constants.REDACTED_TEXT,
      credentials: {
        password: constants.REDACTED_TEXT,
      },
    },
    arrayAsString: ['one', 'two'],
    arrayAsNumber: [1, 2],
    arrayAsObject: [
      {
        name: 'any_name',
        email: 'any_mail@mail.com',
        password: constants.REDACTED_TEXT,
      },
      {
        name: 'any_name_2',
        email: 'any_mail_2@mail.com',
        password: constants.REDACTED_TEXT,
      },
    ],
    images: {
      facematch: constants.REDACTED_TEXT,
      document_front: constants.REDACTED_TEXT,
      document_back: constants.REDACTED_TEXT,
      liveness: [
        constants.REDACTED_TEXT,
        constants.REDACTED_TEXT,
        constants.REDACTED_TEXT,
      ],
    },
  });

describe('shared/utils/utils.ts', () => {
  test('uuid', () => {
    const uuid = Utils.uuid();
    expect(Utils.isUuid(uuid)).toBeTruthy();
    expect(uuid).toHaveLength(36);
  });

  test('calculateAge', () => {
    let birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 38);
    expect(Utils.calculateAge(birthDate)).toStrictEqual(38);

    birthDate = new Date('1994-12-15');
    expect(Utils.calculateAge(birthDate)).toStrictEqual(29);

    birthDate = new Date('1992-11-05');
    expect(Utils.calculateAge(birthDate)).toStrictEqual(31);

    birthDate = new Date('2018-06-16');
    expect(Utils.calculateAge(birthDate)).toStrictEqual(5);
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
      expect(Utils.normalizeValue(test)).toBe(value),
    );
  });

  test('dateNowToSeconds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2023, 5, 13, 0, 0, 0, 0)));
    const seconds = Utils.getNowInSeconds();
    expect(seconds).toStrictEqual(1686614400);
    vi.useRealTimers();
  });

  test('ucFirst', () => {
    expect(Utils.ucFirst('any value')).toEqual('Any value');
  });

  test('stripTags', () => {
    expect(Utils.stripTags('<p>any value</p>')).toEqual('any value');
  });

  test('removeAccents', () => {
    expect(Utils.removeAccents('àÀáÁâÂãÃäÄåÅ')).toEqual('aAaAaAaAaAaA');
    expect(Utils.removeAccents('áÁéÉíÍóÓúÚ')).toEqual('aAeEiIoOuU');
  });

  test('toCamelCase', () => {
    expect(Utils.toCamelCase('any value')).toEqual('anyValue');
    expect(Utils.toCamelCase('Any value')).toEqual('anyValue');
  });

  test('toTitleCase', () => {
    expect(Utils.toTitleCase('any value')).toEqual('Any Value');
  });

  test('isArray', () => {
    expect(Utils.isArray(['a', 'b'])).toBeTruthy();
    expect(Utils.isArray({ a: 'b' })).toBeFalsy();
  });

  test('isObject', () => {
    expect(Utils.isObject({ a: 'b', c: 1 })).toBeTruthy();
    expect(Utils.isObject(['a'])).toBeFalsy();
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

    expect(Utils.sortByAsc(tests, 'age')).deep.equal([
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
    expect(Utils.valueToBase64('any_value')).toEqual('YW55X3ZhbHVl');
  });

  test('base64ToValue', () => {
    expect(Utils.base64ToValue('YW55X3ZhbHVl')).toEqual('any_value');
  });

  test('randomNumber', () => {
    expect(Utils.randomNumber(1000, 9999)).toBeDefined();
    expect(randomInt).toHaveBeenCalledTimes(1);
    expect(randomInt).toHaveBeenCalledWith(1000, 9999);
  });

  test('removeLinesAndSpaceFromSql', () => {
    expect(
      Utils.normalizeSqlQuery(`SELECT *
                               FROM users
                               WHERE 1 = 1`),
    ).toStrictEqual('SELECT * FROM users WHERE 1 = 1');
  });

  test('formatDateYYYYMMDD (UTC+0)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-07-31T21:00:00.000Z'));

    const timezone = Env.getTimezoneUtc();
    expect(timezone).toStrictEqual('UTC');

    const expected = Utils.formatDateYYYYMMDD(new Date(), timezone);
    expect(expected).toStrictEqual('2023-07-31');

    vi.useRealTimers();
  });

  test('formatDateYYYYMMDD (America/Los_Angeles)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-07-31T07:00:00.000Z'));

    const expected = Utils.formatDateYYYYMMDD(
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

    const expected = Utils.formatDateYYYYMMDD(new Date(), timezone);
    expect(expected).toStrictEqual('2023-07-31');

    vi.useRealTimers();
  });

  test('parseDateFromStringWithoutTime: success', () => {
    const expected = Utils.parseDateFromStringWithoutTime('2023-06-15');
    expect(expected).toStrictEqual(new Date(2023, 5, 15, 3, 0, 0, 0));
  });

  test('parseDateFromStringWithoutTime: invalid format', () => {
    const dateAsString = '2023-08-03T00:00:00Z';
    expect(() =>
      Utils.parseDateFromStringWithoutTime(dateAsString),
    ).toThrowError(
      new BadRequestError({
        message: `Invalid date "${dateAsString}", only format "DD/MM/YYYY", "DD-MM-YYYY" and "YYYY-MM-DD" are allowed.`,
      }),
    );
  });

  test('parseDateFromStringWithoutTime: invalid day', () => {
    const dateAsString = '2023-02-31';
    expect(() =>
      Utils.parseDateFromStringWithoutTime(dateAsString),
    ).toThrowError(
      new BadRequestError({
        message:
          'The date "{{dateAsString}}" entered is not valid, please check.',
        metadata: {
          dateAsString,
        },
      }),
    );
  });

  test('parseNameToParts', () => {
    const name = 'Vagner dos Santos Cardoso';
    const { firstName, middleName, lastName } = Utils.parseNameToParts(name);
    expect(firstName).toEqual('Vagner');
    expect(middleName).toEqual('dos Santos');
    expect(lastName).toEqual('Cardoso');
  });

  test('isUndefined', () => {
    expect(Utils.isUndefined(undefined)).toBeTruthy();
    expect(Utils.isUndefined('1')).toBeFalsy();
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

    expect(Utils.removeUndefined(object)).toStrictEqual(expected);
  });

  test('normalizeMoneyFromString', () => {
    [
      ['R$ 1.11', 1.11],
      ['R$ 29,28', 29.28],
      ['R$ 1.982,21', 1982.21],
      ['R$ 999.761,21', 999761.21],
    ].forEach(([value, test]) => {
      expect(Utils.normalizeMoneyFromString(value as string)).toBe(test);
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
      expect(Utils.toDecimal(value)).toStrictEqual(test);
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
      expect(Utils.toCents(value)).toStrictEqual(test);
    });
  });

  test('isUndefined', () => {
    expect(Utils.isUndefined(undefined)).toBeTruthy();
    expect(Utils.isUndefined('1')).toBeFalsy();
  });

  test('roundNumber', () => {
    expect(Utils.roundNumber(1982.8712, 2)).toStrictEqual(1982.87);
    expect(Utils.roundNumber(1982.8712, 4)).toStrictEqual(198287.12);
  });

  test('randomStr', () => {
    const randomStr = Utils.generateRandomString(32);
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
    expect(Utils.convertObjectKeyToLowerCase(input)).toStrictEqual(output);
    expect(Utils.convertObjectKeyToLowerCase(input)).not.deep.equal(input);
  });

  test('rangeCharacters', () => {
    let characters = Utils.rangeCharacters('a', 'z');
    expect(characters).toStrictEqual('abcdefghijklmnopqrstuvwxyz');
    characters = Utils.rangeCharacters('g', 'i');
    expect(characters).toStrictEqual('ghi');
    characters = Utils.rangeCharacters('a', 'g');
    expect(characters).toStrictEqual('abcdefg');
  });

  test('hashFromString', () => {
    expect(Utils.hashFromString('a')).toStrictEqual(177604);
    expect(Utils.hashFromString('texto mais longo')).toStrictEqual(2826721860);
    expect(Utils.hashFromString('js,ts,golang')).toStrictEqual(1177950551);
    expect(Utils.hashFromString('c')).toStrictEqual(177606);
  });

  test('isStatusError valida com os que retorna true', () => {
    const statusErrors = Utils.rangeNumbers(199, 0);
    statusErrors.concat(Utils.rangeNumbers(200, 400));
    statusErrors.forEach((s) => expect(Utils.isStatusError(s)).toBeTruthy());
  });

  test('isStatusError valida os que returna false', () => {
    const statusErrors = Utils.rangeNumbers(200, 200);
    statusErrors.forEach((s) => expect(Utils.isStatusError(s)).toBeFalsy());
  });

  test('cloneObject', () => {
    const object = { name: 'vagner', age: 29 };
    const clone = Utils.cloneObject(object);
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
      expect(Utils.onlyNumber(cpf.format())).toEqual(cpf.toString());
    }

    for (let i = 0; i < 50; i += 1) {
      const cnpj = Cnpj.generate();
      expect(Utils.onlyNumber(cnpj.format())).toEqual(cnpj.toString());
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
      const value = Utils.parseDateFromStringWithoutTime(key);
      expect(value).toStrictEqual(validDates[key]);
    }

    const invalidDates = ['invalid', '2023-02-29'];
    for (const date of invalidDates) {
      expect(() => Utils.parseDateFromStringWithoutTime(date)).toThrowError();
    }
  });

  describe('obfuscateValue', () => {
    test('deveria retornar o objeto modificado e manter o original', () => {
      const value = createObjectObfuscate();
      const expected = createObjectModifiedObfuscate();
      const obfuscateValue = Utils.redactRecursiveKeys(value);
      expect(obfuscateValue).deep.equal(expected);
      expect(value).not.deep.equal(expected);
    });

    test('deveria retornar o array de objeto modificado e manter o original', () => {
      const value = createObjectObfuscate();
      const expected = [
        {
          name: 'any_name',
          email: 'any_mail@mail.com',
          password: constants.REDACTED_TEXT,
        },
        {
          name: 'any_name_2',
          email: 'any_mail_2@mail.com',
          password: constants.REDACTED_TEXT,
        },
      ];
      expect(Utils.redactRecursiveKeys(value.arrayAsObject)).deep.equal(
        expected,
      );
      expect(value).not.deep.equal(expected);
    });

    test('deveria retornar o array de imageBase64 modificado e manter o original', () => {
      const value = createObjectObfuscate();
      const expected = [
        constants.REDACTED_TEXT,
        constants.REDACTED_TEXT,
        constants.REDACTED_TEXT,
      ];
      expect(Utils.redactRecursiveKeys(value.images.liveness)).deep.equal(
        expected,
      );
      expect(value).not.deep.equal(expected);
    });

    test('deveria não modificar o objeto passado com env[REDACTED_KEYS=]', () => {
      vi.spyOn(constants, 'REDACTED_KEYS', 'get').mockReturnValue([]);
      const value = createObjectObfuscate();
      expect(Utils.redactRecursiveKeys(value)).deep.equal(value);
    });
  });
});
