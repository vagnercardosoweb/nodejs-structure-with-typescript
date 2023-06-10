import { describe, expect, it, vi } from 'vitest';

import { Utils } from './utils';

describe('Utils', () => {
  it('isUuid valid', () => {
    const uuid = Utils.uuid();
    expect(Utils.isUuid(uuid)).toBeTruthy();
    expect(uuid).toHaveLength(36);
  });

  it('isUuid invalid', () => {
    vi.spyOn(Utils, 'uuid').mockReturnValueOnce('any_uuid');
    const uuid = Utils.uuid();
    expect(Utils.isUuid(uuid)).toBeFalsy();
    expect(uuid).toEqual('any_uuid');
  });

  it('ucFirst', () => {
    const sut = Utils.ucFirst('any value');
    expect(sut.charAt(0)).toEqual('A');
    expect(sut).toEqual('Any value');
  });

  it('stripTags', () => {
    const sut = Utils.stripTags('<p>any value</p> <b>any bold</b>');
    expect(sut).toEqual('any value any bold');
  });

  it('dateNowToSeconds', () => {
    const sut = Utils.dateNowToSeconds();
    expect(sut).toEqual(expect.any(Number));
    expect(Utils.isValidDate(new Date(sut))).toBeTruthy();
  });

  it('isUndefined', () => {
    expect(Utils.isUndefined(undefined)).toBe(true);
  });

  it('isObject', () => {
    expect(Utils.isObject({ k: 'v' })).toBe(true);
  });

  it('isArray', () => {
    expect(Utils.isArray([1, 1])).toBe(true);
  });

  it('isString', () => {
    expect(Utils.isString('any_value')).toBe(true);
  });

  it('checkStatusError:500', () => {
    expect(Utils.checkStatusError(500)).toBe(true);
  });

  it('checkStatusError:200', () => {
    expect(Utils.checkStatusError(200)).toBe(false);
  });

  it('normalizeMoney', () => {
    expect(Utils.normalizeMoneyFromString('R$ 1.212,23')).toBe(1212.23);
  });

  it('stringToBase64', () => {
    expect(Utils.valueToBase64('any_value')).toEqual('YW55X3ZhbHVl');
  });

  it('stringToBase64', () => {
    expect(Utils.base64ToValue('YW55X3ZhbHVl')).toEqual('any_value');
  });

  it('parseJson', () => {
    expect(Utils.parseJson('any_value', 'value')).toEqual('value');
    expect(Utils.parseJson(null, 'value')).toEqual('value');
    expect(Utils.parseJson(undefined)).toBeUndefined();
    expect(Utils.parseJson({ name: 'name' })).toStrictEqual({ name: 'name' });
  });

  it('normalizeValue', () => {
    expect(Utils.normalizeValue('1.22')).toEqual(1.22);
    expect(Utils.normalizeValue('false')).toEqual(false);
    expect(Utils.normalizeValue('true')).toEqual(true);
    expect(Utils.normalizeValue('null')).toEqual(null);
    expect(Utils.normalizeValue('null')).toEqual(null);
    expect(Utils.normalizeValue('undefined')).toEqual(undefined);
  });

  it('onlyNumber', () => {
    expect(Utils.onlyNumber('111.111.111-11')).toEqual('11111111111');
  });

  it('rangeNumbers', () => {
    const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(Utils.rangeNumbers(10, 1)).toStrictEqual(expected);
  });

  it('randomNumber', () => {
    const spyRandomNumber = vi.spyOn(Utils, 'randomNumber');
    expect(Utils.randomNumber(1, 2)).toBeDefined();
    expect(spyRandomNumber).toHaveBeenCalledTimes(1);
    expect(spyRandomNumber).toHaveBeenCalledWith(1, 2);
  });

  it('toTitleCase', () => {
    expect(Utils.toTitleCase('any value')).toEqual('Any Value');
  });

  it('rangeCharacters', () => {
    expect(Utils.rangeCharacters('A', 'F')).toEqual('ABCDEF');
  });

  it('convertObjectKeyToLowerCase', () => {
    const expected = {
      'auth': 'auth',
      'x-request-id': 'request',
    };
    const object = {
      'Auth': 'auth',
      'X-Request-ID': 'request',
    };
    const sut = Utils.convertObjectKeyToLowerCase(object);
    expect(sut).toStrictEqual(expected);
  });

  it('toCamelCase', () => {
    expect(Utils.toCamelCase('any value')).toEqual('anyValue');
  });

  it('obfuscateValue: testa todos parametros', () => {
    const imageBase64 =
      'data:image/jpeg;base64,H4sICPsdulsCAHJlYWRtZS50eHQAC0/NSc7PTVUoyVdISixONTPRSy8tKlUEAPCdUNYXAAAA';
    const value = {
      name: 'any_name',
      password: 'any_password',
      email: 'any_mail@mail.com',
      nestedObject: {
        name: 'any_name',
        password: 'any_password',
        email: 'any_mail@mail.com',
        credentials: {
          email: 'any_mail@mail.com',
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
    };
    const copyValue = Object.assign({}, value);
    const expected = {
      name: 'any_name',
      email: '*',
      password: '*',
      nestedObject: {
        name: 'any_name',
        password: '*',
        email: '*',
        credentials: {
          email: '*',
          password: '*',
        },
      },
      arrayAsString: ['one', 'two'],
      arrayAsNumber: [1, 2],
      arrayAsObject: [
        {
          name: 'any_name',
          email: '*',
          password: '*',
        },
        {
          name: 'any_name_2',
          email: '*',
          password: '*',
        },
      ],
      images: {
        facematch: '*',
        document_front: '*',
        document_back: '*',
        liveness: ['*', '*', '*'],
      },
    };
    expect(Utils.obfuscateValue(value, ['email'])).toStrictEqual(expected);
    expect(value).toStrictEqual(copyValue);
  });

  it('obfuscateValue: passando um array como argumento', () => {
    const value = [
      {
        name: 'any_name',
        password: 'any_password',
      },
      {
        name: 'any_name_2',
        password: 'any_password_2',
      },
    ];
    const expected = [
      {
        name: 'any_name',
        password: '*',
      },
      {
        name: 'any_name_2',
        password: '*',
      },
    ];
    const sut = Utils.obfuscateValue(value);
    expect(sut).toStrictEqual(expected);
  });

  it('obfuscateValue: retorna o valor original quando a env[OBFUSCATE_VALUE] estiver configurada como falso', () => {
    process.env.OBFUSCATE_VALUE = 'false';
    const value = {
      name: 'any_name',
      password: 'any_password',
    };
    expect(Utils.obfuscateValue(value)).toStrictEqual(value);
  });

  it('formatMoneyToBrl', () => {
    const sut = Utils.formatMoneyToBrl(160.25);
    expect(sut).toStrictEqual('R$ 160,25');
  });

  it('toCents', () => {
    expect(Utils.toCents(19.89)).toBe(1989);
  });

  it('toCents', () => {
    expect(Utils.toDecimal(1989)).toBe(19.89);
  });

  it('removeAccents', () => {
    expect(Utils.removeAccents('áéíóúç')).toEqual('aeiouc');
  });

  it('randomStr', () => {
    const sut = Utils.randomStr(32);
    expect(sut).toEqual(expect.any(String));
    expect(sut).toHaveLength(32);
  });

  it('getFirstAndLastName', () => {
    const { firstName, lastName } = Utils.getFirstAndLastName('Any Name');
    expect(firstName).toEqual('Any');
    expect(lastName).toEqual('Name');
  });

  it('formatDateYYYYMMDD', () => {
    expect(Utils.formatDateYYYYMMDD(new Date(2023, 2, 1))).toEqual(
      '2023-03-01',
    );
  });
});
