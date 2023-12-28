import { beforeEach, describe, expect, it } from 'vitest';

import { Translation } from '@/shared/translation';

const localePtbr: Record<string, any> = {
  key: 'key_ptbr',
  replace: 'Meu nome é [{{name}}] e tenho [{{age}}] anos',
  nested: { key: 'nested.key' },
  array: [{ key: 'key' }],
};

const localeEn: Record<string, any> = {
  key: 'key_en',
  replace: 'My name is [{{name}}] and I am [{{age}}] years old',
};

let sut: Translation;

describe('Translation', () => {
  beforeEach(() => {
    sut = new Translation();
    sut.add('en', localeEn);
    sut.add('pt-br', localePtbr);
  });

  it('should clear the translations and verify [pt-br]', () => {
    sut = sut.withLocale('pt-br');
    sut.clear();

    expect(sut.get('key')).toEqual('key');
    expect(sut.getLocale()).toEqual('pt-br');
  });

  it('should clear the translations and verify [en]', () => {
    sut = sut.withLocale('en');
    sut.clear();

    expect(sut.get('key')).toEqual('key');
    expect(sut.getLocale()).toEqual('en');
  });

  it('should check the translation using the default locale [pt-br]', () => {
    sut = sut.withLocale('pt-br');
    expect(sut.get('key')).toEqual('key_ptbr');
    expect(sut.get('nested.key')).toEqual('nested.key');
    expect(sut.get('array.0.key')).toEqual('array.0.key');
    expect(sut.get('replace', { name: 'any', age: 28 })).toEqual(
      'Meu nome é [any] e tenho [28] anos',
    );
    expect(sut.get('nokey')).toEqual('nokey');
    expect(sut.getLocale()).toEqual('pt-br');
  });

  it('should check the translation using the locale [en]', () => {
    sut = sut.withLocale('en');

    expect(sut.get('key')).toEqual('key_en');
    expect(sut.get('replace', { name: 'any', age: 28 })).toEqual(
      'My name is [any] and I am [28] years old',
    );

    expect(sut.getLocale()).toEqual('en');
  });
});
