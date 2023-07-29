import { randomInt } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import { Cnpj, Cpf } from '@/shared';

import { Utils } from './utils';

vi.mock('node:crypto', async () => {
  const actual = (await vi.importActual('node:crypto')) as any;
  return {
    ...actual,
    randomInt: vi.fn().mockResolvedValue(0),
    randomBytes: vi.fn().mockReturnValue('a'),
  };
});

const createObjectObfuscate = () => {
  const imageBase64 =
    'data:image/jpeg;base64,H4sICPsdulsCAHJlYWRtZS50eHQAC0/NSc7PTVUoyVdISixONTPRSy8tKlUEAPCdUNYXAAAA';
  return Object.freeze({
    name: 'any_name',
    password: 'any_password',
    email: 'any_mail@mail.com',
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
    password: '*',
    nestedObject: {
      name: 'any_name',
      password: '*',
      credentials: {
        password: '*',
      },
    },
    arrayAsString: ['one', 'two'],
    arrayAsNumber: [1, 2],
    arrayAsObject: [
      {
        name: 'any_name',
        email: 'any_mail@mail.com',
        password: '*',
      },
      {
        name: 'any_name_2',
        email: 'any_mail_2@mail.com',
        password: '*',
      },
    ],
    images: {
      facematch: '*',
      document_front: '*',
      document_back: '*',
      liveness: ['*', '*', '*'],
    },
  });

describe('shared/utils/utils.ts', () => {
  it('uuid', () => {
    const uuid = Utils.uuid();
    expect(Utils.isUuid(uuid)).toBeTruthy();
    expect(uuid).toHaveLength(36);
  });

  it('normalizeValue', () => {
    [
      ['1.11', 1.11],
      ['11', 11],
      ['true', true],
      ['false', false],
      ['null', null],
      ['undefined', undefined],
    ].forEach(([test, value]) =>
      expect(Utils.normalizeValue(test)).toBe(value),
    );
  });

  it('dateNowToSeconds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2023, 5, 13, 0, 0, 0, 0)));
    const seconds = Utils.dateNowToSeconds();
    expect(seconds).toStrictEqual(1686614400);
    vi.useRealTimers();
  });

  it('ucFirst', () => {
    expect(Utils.ucFirst('any value')).toEqual('Any value');
  });

  it('stripTags', () => {
    expect(Utils.stripTags('<p>any value</p>')).toEqual('any value');
  });

  it('removeAccents', () => {
    expect(Utils.removeAccents('áéíóúç')).toEqual('aeiouc');
  });

  it('toCamelCase', () => {
    expect(Utils.toCamelCase('any value')).toEqual('anyValue');
    expect(Utils.toCamelCase('Any value')).toEqual('anyValue');
  });

  it('toTitleCase', () => {
    expect(Utils.toTitleCase('any value')).toEqual('Any Value');
  });

  it('isArray', () => {
    expect(Utils.isArray(['a', 'b'])).toBeTruthy();
    expect(Utils.isArray({ a: 'b' })).toBeFalsy();
  });

  it('isObject', () => {
    expect(Utils.isObject({ a: 'b', c: 1 })).toBeTruthy();
    expect(Utils.isObject(['a'])).toBeFalsy();
  });

  it('sortByAsc', () => {
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

  it('valueToBase64', () => {
    expect(Utils.valueToBase64('any_value')).toEqual('YW55X3ZhbHVl');
  });

  it('base64ToValue', () => {
    expect(Utils.base64ToValue('YW55X3ZhbHVl')).toEqual('any_value');
  });

  it('randomNumber', () => {
    expect(Utils.randomNumber(1000, 9999)).toBeDefined();
    expect(randomInt).toHaveBeenCalledTimes(1);
    expect(randomInt).toHaveBeenCalledWith(1000, 9999);
  });

  it('removeLinesAndSpaceFromSql', () => {
    expect(
      Utils.normalizeSqlQuery(`SELECT *
                                        FROM users
                                        WHERE 1 = 1`),
    ).toStrictEqual('SELECT * FROM users WHERE 1 = 1');
  });

  it('formatDateYYYYMMDD', () => {
    const validDates: Record<string, Date> = {
      '2023-06-15': Utils.parseDateFromStringWithoutTime('2023-06-15'),
      '2023-06-18': new Date('2023-06-18T20:59:59'),
      '2023-06-29': new Date('2023-06-30T02:59:59Z'),
      '2023-06-30': new Date('2023-07-01T02:59:59Z'),
      '2023-07-01': new Date('2023-07-01T21:00:01Z'),
      '2023-07-02': new Date('2023-07-02T03:00:01Z'),
      '2023-07-03': new Date('2023-07-04T02:59:59Z'),
      '2023-02-28': new Date(2023, 1, 28, 0, 0, 0, 0),
      '2023-06-05': new Date(2023, 5, 5, 2, 59, 59, 0),
      '2023-07-04': new Date(2023, 6, 4),
      '2023-06-01': new Date(2023, 5, 1),
    };

    for (const key in validDates) {
      const value = Utils.formatDateYYYYMMDD(validDates[key]);
      expect(value).toStrictEqual(key);
    }
  });

  it('getFirstAndLastName', () => {
    const fullName = 'Vagner dos Santos Cardoso';
    const { firstName, lastName } = Utils.getFirstAndLastName(fullName);
    expect(firstName).toEqual('Vagner');
    expect(lastName).toEqual('dos Santos Cardoso');
  });

  it('isUndefined', () => {
    expect(Utils.isUndefined(undefined)).toBeTruthy();
    expect(Utils.isUndefined('1')).toBeFalsy();
  });

  it('removeUndefined', () => {
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

  it('normalizeMoneyFromString', () => {
    [
      ['R$ 1.11', 1.11],
      ['R$ 29,28', 29.28],
      ['R$ 1.982,21', 1982.21],
      ['R$ 999.761,21', 999761.21],
    ].forEach(([value, test]) => {
      expect(Utils.normalizeMoneyFromString(value as string)).toBe(test);
    });
  });

  it('toDecimal', () => {
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

  it('toCents', () => {
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

  it('isUndefined', () => {
    expect(Utils.isUndefined(undefined)).toBeTruthy();
    expect(Utils.isUndefined('1')).toBeFalsy();
  });

  it('roundNumber', () => {
    expect(Utils.roundNumber(1982.8712, 2)).toStrictEqual(1982.87);
    expect(Utils.roundNumber(1982.8712, 4)).toStrictEqual(198287.12);
  });

  it('randomStr', () => {
    const randomStr = Utils.generateRandomString(32);
    expect(randomStr).toStrictEqual('YQYQYQYQYQYQYQYQYQYQYQYQYQYQYQYQ');
    expect(randomStr).toHaveLength(32);
  });

  it('convertObjectKeyToLowerCase', () => {
    const input = {
      'Name': '*',
      'X-ID-Token': '*',
      'Authorization': '*',
      'X-Api-Key': '*',
    };
    const output = {
      'name': '*',
      'x-id-token': '*',
      'authorization': '*',
      'x-api-key': '*',
    };
    expect(Utils.convertObjectKeyToLowerCase(input)).toStrictEqual(output);
    expect(Utils.convertObjectKeyToLowerCase(input)).not.deep.equal(input);
  });

  it('rangeCharacters', () => {
    let characters = Utils.rangeCharacters('a', 'z');
    expect(characters).toStrictEqual('abcdefghijklmnopqrstuvwxyz');
    characters = Utils.rangeCharacters('g', 'i');
    expect(characters).toStrictEqual('ghi');
    characters = Utils.rangeCharacters('a', 'g');
    expect(characters).toStrictEqual('abcdefg');
  });

  it('hashFromString', () => {
    expect(Utils.hashFromString('a')).toStrictEqual(177604);
    expect(Utils.hashFromString('texto mais longo')).toStrictEqual(2826721860);
    expect(Utils.hashFromString('js,ts,golang')).toStrictEqual(1177950551);
    expect(Utils.hashFromString('c')).toStrictEqual(177606);
  });

  it('isStatusError valida com os que retorna true', () => {
    const statusErrors = Utils.rangeNumbers(199, 0);
    statusErrors.concat(Utils.rangeNumbers(200, 400));
    statusErrors.forEach((s) => expect(Utils.isStatusError(s)).toBeTruthy());
  });

  it('isStatusError valida os que returna false', () => {
    const statusErrors = Utils.rangeNumbers(200, 200);
    statusErrors.forEach((s) => expect(Utils.isStatusError(s)).toBeFalsy());
  });

  it('cloneObject', () => {
    const object = { name: 'vagner', age: 29 };
    const clone = Utils.cloneObject(object);
    clone.name = 'vagner cardoso';
    clone.age = 30;
    expect(clone.name).toStrictEqual('vagner cardoso');
    expect(clone.age).toStrictEqual(30);
    expect(object.name).toStrictEqual('vagner');
    expect(object.age).toStrictEqual(29);
  });

  it('onlyNumber', () => {
    for (let i = 0; i < 50; i += 1) {
      const cpf = Cpf.generate();
      expect(Utils.onlyNumber(cpf.format())).toEqual(cpf.toString());
    }

    for (let i = 0; i < 50; i += 1) {
      const cnpj = Cnpj.generate();
      expect(Utils.onlyNumber(cnpj.format())).toEqual(cnpj.toString());
    }
  });

  it('parseDate', () => {
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
    it('deveria retornar o objeto modificado e manter o original', () => {
      const value = createObjectObfuscate();
      const expected = createObjectModifiedObfuscate();
      const obfuscateValue = Utils.obfuscateValues(value);
      expect(obfuscateValue).deep.equal(expected);
      expect(value).not.deep.equal(expected);
    });

    it('deveria retornar o array de objeto modificado e manter o original', () => {
      const value = createObjectObfuscate();
      const expected = [
        {
          name: 'any_name',
          email: 'any_mail@mail.com',
          password: '*',
        },
        {
          name: 'any_name_2',
          email: 'any_mail_2@mail.com',
          password: '*',
        },
      ];
      expect(Utils.obfuscateValues(value.arrayAsObject)).deep.equal(expected);
      expect(value).not.deep.equal(expected);
    });

    it('deveria retornar o array de imageBase64 modificado e manter o original', () => {
      const value = createObjectObfuscate();
      const expected = ['*', '*', '*'];
      expect(Utils.obfuscateValues(value.images.liveness)).deep.equal(expected);
      expect(value).not.deep.equal(expected);
    });

    it('deveria não modificar o objeto passado com env[OBFUSCATE_VALUE=false]', () => {
      process.env.OBFUSCATE_VALUE = 'false';
      const value = createObjectObfuscate();
      expect(Utils.obfuscateValues(value)).deep.equal(value);
    });
  });
});
