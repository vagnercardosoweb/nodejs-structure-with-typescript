import { beforeEach, describe } from 'vitest';

import { Translation } from '@/shared/translation';

const defaultLocale = 'pt-br';
const locales = {
  [defaultLocale]: {
    key: 'pt-br chave',
    replace: 'Meu nome é "{{name}}" e tenho "{{age}}" anos',
  },
  en: {
    replace: 'My name is "{{name}}" and I am "{{age}}" years old',
    key: 'en key',
  },
};

describe('src/shared/translation', () => {
  let sut: Translation;

  beforeEach(() => {
    sut = new Translation(defaultLocale);
    sut.add('pt-br', locales['pt-br']);
    sut.add('en', locales.en);
  });

  it('should retrieve the translation with the default "pt-br" language', () => {
    expect(sut.get('key')).toBe(locales[defaultLocale].key);
    expect(
      sut.get('replace', {
        name: 'John',
        age: 20,
      }),
    ).toBe('Meu nome é "John" e tenho "20" anos');
    expect(sut.getLocale()).toBe(defaultLocale);
  });

  it('should retrieve the translation with the "en" language', () => {
    sut = sut.withLocale('en');
    expect(sut.get('key')).toBe(locales.en.key);
    expect(
      sut.get('replace', {
        name: 'John',
        age: 20,
      }),
    ).toBe('My name is "John" and I am "20" years old');
    expect(sut.getLocale()).toBe('en');
  });

  it('should check if the registered key exists', () => {
    expect(sut.has('key')).toBe(true);
    expect(sut.has('key2')).toBe(false);
  });

  it('should return the key when the translation does not exist', () => {
    expect(sut.get('key2')).toBe('key2');
  });

  it('should execute the "withLocale" method with the same language already defined before', () => {
    sut = sut.withLocale(defaultLocale);
    expect(sut.getLocale()).toBe(defaultLocale);
  });

  it('should execute the "withLocal" method with the language and domain "en-US" and return the language "en"', () => {
    sut = sut.withLocale('en-US');
    expect(sut.getLocale()).toBe('en');
  });

  it(`you should try to set a language that doesn't exist and return the same already defined and the same class without modification`, () => {
    const sut2 = sut.withLocale('not_exist');
    expect(sut2.getLocale()).toBe(defaultLocale);
    expect(sut2).toBe(sut);
  });

  it('should define a new language that exists and validate if the classes are different', () => {
    const sut2 = sut.withLocale('en');
    expect(sut2.getLocale()).toBe('en');
    expect(sut2).not.toBe(sut);
  });

  it('should clean up the translations', () => {
    sut.clear();
    expect(sut.getLocale()).toBe(defaultLocale);
    expect((sut as any).translations.size).toBe(0);
    expect(sut.has('key')).toBeFalsy();
  });
});
