import { randomBytes, randomUUID } from 'node:crypto';

import {
  base64ToString,
  generateCharacters,
  generateRandomString,
  hashFromString,
  hasSpecialCharacter,
  isBase64,
  isBase64Image,
  isCompleteName,
  isString,
  isValidUuid,
  parseNameToParts,
  removeAccents,
  removeLinesAndSpaces,
  replaceMustache,
  stringToBase64,
  stripTags,
  strLimit,
  toCamelCase,
  toTitleCase,
  ucFirst,
} from '@/shared/string';

describe('src/shared/utils/string', () => {
  it('isString should return true if value is a string', () => {
    expect(isString('')).toBe(true);
    expect(isString('any value')).toBe(true);
  });

  it('isString should return false if value is not a string', () => {
    expect(isString(1)).toBe(false);
    expect(isString(true)).toBe(false);
    expect(isString(false)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString({})).toBe(false);
    expect(isString([])).toBe(false);
  });

  it.each([
    ['invalid_uuid', false],
    ['123e4567-e89b-12d3-a456-426614174000', true],
    ['123ako12-kams-rd21-aaaa-bbbbbbbbbbbb', false],
    [randomUUID(), true],
  ])('isValidUuid("%s") should return "%s"', (uuid, expected) => {
    expect(isValidUuid(uuid)).toBe(expected);
  });

  it('ucFirst should return the first letter capitalized', () => {
    expect(ucFirst('any value')).toEqual('Any value');
  });

  it('stripTags should remove all html tags', () => {
    expect(stripTags('<p>any value</p>')).toEqual('any value');
    expect(stripTags('<p>value</p>\n<b>bold</b>')).toEqual('value\nbold');
    expect(stripTags('<p>any value</p><br>')).toEqual('any value');
  });

  it('base64ToString should convert base64 to string', () => {
    expect(base64ToString('YW55IHZhbHVl')).toEqual('any value');
  });

  it('stringToBase64 should convert string to base64', () => {
    expect(stringToBase64('any value')).toEqual('YW55IHZhbHVl');
  });

  it('isBase64 should return true if value is base64', () => {
    expect(isBase64(stringToBase64(randomBytes(16).toString()))).toBe(true);
  });

  it('isBase64 should return false if value is not base64', () => {
    expect(isBase64(randomBytes(16).toString())).toBe(false);
  });

  it('isBase64ImageFromString should return true if value is a base64 image', () => {
    ['png', 'jpg', 'jpeg', 'gif', 'svg'].forEach((ext) => {
      expect(
        isBase64Image(`data:image/${ext};base64,iVBORw0KGgoAAAANSUhEUgAAAAUA`),
      ).toBe(true);
    });
  });

  it('isImageBase64 should return false if value is not a base64 image', () => {
    expect(isBase64Image('any value')).toBe(false);
  });

  it('generateRandomString should return a random string', () => {
    expect(generateRandomString(16)).toHaveLength(16);
    expect(generateRandomString(32)).toHaveLength(32);
    expect(isBase64(generateRandomString(64))).toBe(true);
  });

  it.each([
    ['àÀáÁâÂãÃäÄåÅ', 'aAaAaAaAaAaA'],
    ['áÁéÉíÍóÓúÚ', 'aAeEiIoOuU'],
  ])('removeAccents("%s") should remove all accents', (value, expected) => {
    expect(removeAccents(value)).toEqual(expected);
  });

  it('removeLinesAndSpaces should remove all line breaks and spaces', () => {
    expect(
      removeLinesAndSpaces(`
      One line ...
      Two lines ...
      Spaces   end...
      Bye!
    `),
    ).toEqual('One line ... Two lines ... Spaces end... Bye!');
  });

  it('rangeCharacters should return a range of characters', () => {
    let characters = generateCharacters('a', 'z');
    expect(characters).toStrictEqual('abcdefghijklmnopqrstuvwxyz');
    characters = generateCharacters('g', 'i');
    expect(characters).toStrictEqual('ghi');
    characters = generateCharacters('a', 'g');
    expect(characters).toStrictEqual('abcdefg');
  });

  it('strLimit should return a string with a limit of characters', () => {
    expect(strLimit('any value', 3)).toEqual('any');
    expect(strLimit('any value', 10, '...')).toEqual('any value');
    expect(strLimit('any value', 3, '...')).toEqual('any...');
  });

  it('replaceMustache should replace all mustache values', () => {
    const template = 'Hello {{name}} {{lastName}}';
    const context = { name: 'John', lastName: 'Doe' };
    expect(replaceMustache(template, context)).toEqual('Hello John Doe');
  });

  it('parseNameToParts should return the name parts', () => {
    expect(parseNameToParts('First Middle Name And End Name')).toStrictEqual({
      firstName: 'First',
      middleName: 'Middle Name And End',
      lastName: 'Name',
    });

    expect(parseNameToParts('John Doe')).toStrictEqual({
      firstName: 'John',
      middleName: '',
      lastName: 'Doe',
    });

    expect(parseNameToParts('')).toStrictEqual({
      firstName: '',
      middleName: '',
      lastName: '',
    });
  });

  it('toCamelCase should return a string in camel case', () => {
    expect(toCamelCase('any value')).toEqual('anyValue');
    expect(toCamelCase('any value with spaces')).toEqual('anyValueWithSpaces');
    expect(toCamelCase('any value with - and _')).toEqual('anyValueWithAnd');
    expect(toCamelCase('any value with -')).toEqual('anyValueWith');

    expect(toCamelCase('Any Value')).toEqual('anyValue');
    expect(toCamelCase('Any Value With Spaces')).toEqual('anyValueWithSpaces');
    expect(toCamelCase('Any Value With - And _')).toEqual('anyValueWithAnd');
    expect(toCamelCase('Any Value With -')).toEqual('anyValueWith');
  });

  it('toTitleCase should return a string in title case', () => {
    expect(toTitleCase('any value')).toEqual('Any Value');
    expect(toTitleCase('any value with spaces')).toEqual(
      'Any Value With Spaces',
    );
    expect(toTitleCase('any value with - and _')).toEqual(
      'Any Value With - And _',
    );
    expect(toTitleCase('any value with -')).toEqual('Any Value With -');

    expect(toTitleCase('Any Value')).toEqual('Any Value');
    expect(toTitleCase('Any Value With Spaces')).toEqual(
      'Any Value With Spaces',
    );
    expect(toTitleCase('Any Value With - And _')).toEqual(
      'Any Value With - And _',
    );
    expect(toTitleCase('Any Value With -')).toEqual('Any Value With -');
  });

  it('isCompleteName should return true if name is complete', () => {
    expect(isCompleteName('First Middle Name And End Name')).toBe(true);
    expect(isCompleteName('John Doe')).toBe(true);
  });

  it('isCompleteName should return false if name is not complete', () => {
    expect(isCompleteName('')).toBe(false);
    expect(isCompleteName('John')).toBe(false);
    expect(isCompleteName('John ')).toBe(false);
  });

  it('hashFromString should return a hash from string', () => {
    expect(hashFromString('any value')).toBe(1571657560);
    expect(hashFromString('lorem ipsum dolor sit amet')).toBe(2019624743);
    expect(hashFromString('typescript')).toBe(3633045330);
  });

  it.each(
    `-_{}[]+=)(*&¨%$#@!\`´^~;:/?.>,<|"`.split('').map((value) => [value, true]),
  )('hasSpecialCharacter("%s") should return "true"', (value, expected) => {
    expect(hasSpecialCharacter(value)).toBe(expected);
  });

  it('hasSpecialCharacter should return false if value has no special character', () => {
    expect(hasSpecialCharacter('any value')).toBe(false);
    expect(hasSpecialCharacter('any value with spaces')).toBe(false);
    expect(
      hasSpecialCharacter(
        '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      ),
    ).toBe(false);
  });
});
