import { expect } from 'vitest';

import { Container, InternalServerError } from '@/shared';

const arrayAsArray = [[{ name: 'any_name' }], [1, 2, 3], ['a', 'b', 'c']];
const testCases = {
  number: 1,
  string: 'string',
  float: 1.18,
  booleanAsFalse: false,
  booleanAsTrue: true,
  function: () => 'function',
  arrayAsObject: [{ name: 'any_name' }],
  arrayAsNumber: [1, 2, 3],
  arrayAsString: ['a', 'b', 'c'],
  object: { name: 'any_name', array: arrayAsArray },
  symbol: Symbol('test'),
  null: null,
  undefined,
  arrayAsArray,
  set: new Set(['a', 'b', 'd']),
  map: new Map([
    ['a', 1],
    ['b', 2],
  ]),
};

describe('shared/container', () => {
  it('deveria adicionar uma classe construtora ao container', () => {
    const container = new Container();
    const testInstance = new (class Test {
      public test() {
        return 'test';
      }
    })();

    container.set('class', testInstance);

    expect(container.items.has('class')).toBeTruthy();
    expect(container.get('class')).toStrictEqual(testInstance);
    expect(container.resolved.has('class')).toBeTruthy();
    expect(container.items.has('class')).toBeFalsy();
  });

  it('deveria lançar um erro ao tentar recuperar um item que não foi registrado', () => {
    const container = new Container();
    const id = 'no_exist_key';
    expect(() => container.get(id)).toThrowError(
      new InternalServerError({
        message: `Container value "${id}" has not been defined`,
        code: 'CONTAINER:NOT_EXIST',
      }),
    );
  });

  it('deveria criar, recuperar e recriar um item já resolvido', () => {
    const container = new Container();
    container.set('key', 'value');

    const value = container.get('key');
    expect(value).toStrictEqual('value');

    expect(container.resolved.has('key')).toBeTruthy();
    expect(container.items.has('key')).toBeFalsy();

    container.set('key', 'value');
    expect(container.resolved.has('key')).toBeFalsy();
    expect(container.items.has('key')).toBeTruthy();
  });

  it('deveria recuperar um item já resolvido no método [get]', () => {
    const container = new Container();
    container.set('key', 'value');
    expect(container.resolved.has('key')).toBeFalsy();
    const value = container.get('key');
    expect(value).toStrictEqual('value');
    expect(container.resolved.has('key')).toBeTruthy();
    const value2 = container.get('key');
    expect(value2).toStrictEqual('value');
    expect(container.items.has('key')).toBeFalsy();
  });

  it('deveria verifica se um item existe com método [has] sem ser resolvido', () => {
    const container = new Container();
    container.set('key', 'value');
    expect(container.resolved.has('key')).toBeFalsy();
    expect(container.has('key')).toBeTruthy();
  });

  it('deveria verifica se um item existe com método [has] resolvido', () => {
    const container = new Container();
    container.set('key', 'value');
    expect(container.get('key')).toStrictEqual('value');
    expect(container.resolved.has('key')).toBeTruthy();
    expect(container.has('key')).toBeTruthy();
  });

  it('deveria verifica se um item não existe com método [has]', () => {
    const container = new Container();
    expect(container.has('key')).toBeFalsy();
  });

  it('deveria realizar o clone do objeto do container', () => {
    const container = new Container();
    container.set('key', 'value');

    const clone = container.clone();

    expect(clone.items.has('key')).toBeTruthy();
    expect(container.get('key')).toStrictEqual('value');
    expect(clone.resolved.has('key')).toBeFalsy();

    clone.set('key', 'value_modified');
    expect(clone.get('key')).toStrictEqual('value_modified');
    expect(clone.resolved.has('key')).toBeTruthy();

    expect(container.get('key')).not.toStrictEqual(clone.get('key'));
  });

  Object.entries(testCases).forEach(([key, value]) => {
    it(`deveria criar e validar o item com a chave [${key}] nos registros`, () => {
      const container = new Container();
      container.set(key, value);

      if (typeof value === 'function') value = value();

      const resolved = container.get(key);
      expect(resolved).toStrictEqual(value);

      expect(container.resolved.has(key)).toBeTruthy();
      expect(container.items.has(key)).toBeFalsy();
    });
  });
});
