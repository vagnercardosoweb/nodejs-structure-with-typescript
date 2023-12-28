import { expect } from 'vitest';

import { Container } from '@/shared/container';
import { InternalServerError } from '@/shared/errors';

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
  it('should add a constructor class to the container', () => {
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

  it('should throw an error when trying to retrieve an item that has not been registered', () => {
    const container = new Container();
    const id = 'no_exist_key';
    expect(() => container.get(id)).toThrowError(
      new InternalServerError({
        message: `Container value "${id}" has not been defined`,
        code: 'CONTAINER:NOT_EXIST',
      }),
    );
  });

  it('should create, retrieve and recreate an already resolved item', () => {
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

  it('should retrieve an item already resolved in the [get] method', () => {
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

  it('should check if an item exists with method [has] without being resolved', () => {
    const container = new Container();
    container.set('key', 'value');
    expect(container.resolved.has('key')).toBeFalsy();
    expect(container.has('key')).toBeTruthy();
  });

  it('should check if an item exists with method [has] resolved', () => {
    const container = new Container();
    container.set('key', 'value');
    expect(container.get('key')).toStrictEqual('value');
    expect(container.resolved.has('key')).toBeTruthy();
    expect(container.has('key')).toBeTruthy();
  });

  it('should check if an item does not exist with [has] method', () => {
    const container = new Container();
    expect(container.has('key')).toBeFalsy();
  });

  it('should clone the container object', () => {
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
    it(`should create and validate the item with the key [${key}] in the records`, () => {
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
