import { Container, InternalServerError } from '@/shared';

describe('Container', () => {
  it('should check if a value has been resolved', () => {
    const container = new Container();

    const anyNumber = 1;
    const anyString = 'any_value_string';
    const anyObject = { key: 'value' };
    const anyArray = [anyObject];

    container.set('any_key_number', anyNumber);
    container.set('any_key_string', anyString);
    container.set('any_key_object', anyObject);
    container.set('any_key_array', anyArray);
    container.set('any_key_fn', () => 'any_value_fn');

    expect(container.get('any_key_number')).toStrictEqual(anyNumber);
    expect(container.get('any_key_string')).toStrictEqual(anyString);
    expect(container.get('any_key_object')).toStrictEqual(anyObject);
    expect(container.get('any_key_array')).toStrictEqual(anyArray);
    expect(container.get('any_key_fn')).toStrictEqual('any_value_fn');
  });

  it('should check if there is an item registered with literal value', () => {
    const container = new Container();
    container.set('any_key', 'any_value');
    expect(container.has('any_key')).toBeTruthy();
  });

  it('should check if there is an item registered with fn value literal', () => {
    const container = new Container();
    container.set('key', () => 'value');
    expect(container.has('key')).toBeFalsy();
  });

  it('should register a class', () => {
    const container = new Container();

    const anyClass = new (class {
      public test() {
        return 'test';
      }
    })();

    container.set('class', anyClass);
    expect(container.has('class')).toBeTruthy();

    expect(container.items.get('class')).toStrictEqual(anyClass);
    expect(container.get<any>('class').test()).toStrictEqual('test');
  });

  it('should throw an error when trying to retrieve an item that has not been registered', () => {
    const container = new Container();
    const id = 'no_exist_key';
    expect(() => container.get(id)).toThrowError(
      new InternalServerError({
        code: 'CONTAINER:NOT_EXIST',
        message: 'Container value [{{id}}] has not been defined',
        sendToSlack: true,
        metadata: { id },
      }),
    );
  });

  it('should return an already resolved item', () => {
    const container = new Container();

    const value = () => 'value';

    container.set('key', value);
    container.get('key');

    expect(container.has('key')).toBeTruthy();
    expect(container.items.get('key')).toBeUndefined();
    expect(container.resolved.get('key')).toStrictEqual('value');
    expect(container.get('key')).toEqual('value');
  });
});
