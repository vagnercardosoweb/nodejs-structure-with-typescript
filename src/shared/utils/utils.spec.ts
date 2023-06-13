import { randomInt } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import { Cnpj, Cpf } from '@/shared';

import { Utils } from './utils';

vi.mock('node:crypto', async () => {
  const actual = (await vi.importActual('node:crypto')) as any;
  return { ...actual, randomInt: vi.fn().mockResolvedValue(0) };
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
    vi.setSystemTime(new Date(2023, 5, 13));
    const seconds = Utils.dateNowToSeconds();
    expect(seconds).toStrictEqual(1686625200);
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
      Utils.removeLinesAndSpaceFromSql(`SELECT *
                                        FROM users
                                        WHERE 1 = 1`),
    ).toStrictEqual('SELECT * FROM users WHERE 1 = 1');
  });

  it('formatDateYYYYMMDD', () => {
    const date = new Date(2023, 2, 1);
    const formatDate = Utils.formatDateYYYYMMDD(date);
    expect(formatDate).toEqual('2023-03-01');
  });

  it('getFirstAndLastName', () => {
    const { firstName, lastName } = Utils.getFirstAndLastName(
      'Vagner dos Santos Cardoso',
    );
    expect(firstName).toEqual('Vagner');
    expect(lastName).toEqual('dos Santos Cardoso');
  });

  it('isUndefined', () => {
    expect(Utils.isUndefined(undefined)).toBeTruthy();
    expect(Utils.isUndefined('1')).toBeFalsy();
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

  describe('obfuscateValue', () => {
    it('deveria retornar o objeto modificado e manter o original', () => {
      const value = createObjectObfuscate();
      const expected = createObjectModifiedObfuscate();
      const obfuscateValue = Utils.obfuscateValue(value);
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
      expect(Utils.obfuscateValue(value.arrayAsObject)).deep.equal(expected);
      expect(value).not.deep.equal(expected);
    });

    it('deveria retornar o array de imageBase64 modificado e manter o original', () => {
      const value = createObjectObfuscate();
      const expected = ['*', '*', '*'];
      expect(Utils.obfuscateValue(value.images.liveness)).deep.equal(expected);
      expect(value).not.deep.equal(expected);
    });

    it('deveria não modificar o objeto passado com env[OBFUSCATE_VALUE=false]', () => {
      process.env.OBFUSCATE_VALUE = 'false';
      const value = createObjectObfuscate();
      expect(Utils.obfuscateValue(value)).deep.equal(value);
    });
  });
});
