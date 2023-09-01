import { EventManager, InternalServerError, Utils } from '@/shared';

let eventManager: EventManager;

describe('EventManager', () => {
  beforeEach(() => {
    eventManager = new EventManager();
  });

  it('deveria registrar um evento ', () => {
    const handler = vi.fn();
    const eventName = 'test';
    eventManager.register(eventName, handler);
    const handlers = (eventManager as any).handlers;
    expect(handlers[eventName]).toHaveLength(1);
    expect(handlers[eventName][0]).toStrictEqual(handler);
  });

  it('deveria remover os eventos registrados', () => {
    const handler = vi.fn();
    const handler2 = vi.fn();
    const eventName = 'test';

    eventManager.register(eventName, handler);
    eventManager.register(eventName, handler2);

    eventManager.remove(eventName, handler);
    let handlers = (eventManager as any).handlers;
    expect(handlers[eventName]).toHaveLength(1);
    expect(handlers[eventName][0]).toStrictEqual(handler2);

    eventManager.remove(eventName, handler2);
    handlers = (eventManager as any).handlers;
    expect(handlers[eventName]).toBeUndefined();
  });

  it('deveria lançar um erro ao registrar mais de um evento com mesmo handler', () => {
    const handler = vi.fn();
    const eventName = 'test';
    eventManager.register(eventName, handler);
    expect(() => eventManager.register(eventName, handler)).toThrowError(
      new InternalServerError({
        message:
          'The handler for the event "{{eventName}}" has already been registered',
        metadata: { eventName },
      }),
    );
  });

  it('deveria limpar todos os eventos', () => {
    const handler = vi.fn();
    const handler2 = vi.fn();
    const eventName = 'test';

    eventManager.register(eventName, handler);
    eventManager.register(eventName, handler2);

    eventManager.clear();
    expect((eventManager as any).handlers).toStrictEqual({});
  });

  it('deveria registrar um evento e realizar o disparar', () => {
    const handler = vi.fn();
    const eventName = 'test';

    eventManager.register(eventName, handler);
    eventManager.dispatch(eventName, { id: 'id' });

    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith({
      name: eventName,
      createdAt: expect.any(Date),
      payload: { id: 'id' },
    });
  });

  it('deveria disparar um evento (sync) que lança um erro e não propaga para o chamador e verificar se realizou o log', () => {
    const eventName = 'test';
    const loggerSpy = vi.spyOn((eventManager as any).logger, 'error');

    const handler = vi.fn();
    handler.mockImplementation(() => {
      throw new Error('test');
    });

    eventManager.register(eventName, handler);
    expect(() => eventManager.dispatch(eventName, { id: 'id' })).not.toThrow();
    expect(handler).toBeCalledTimes(1);

    expect(loggerSpy).toBeCalledTimes(1);
    expect(loggerSpy).toBeCalledWith('DISPATCH_ERROR', {
      event: {
        name: eventName,
        createdAt: expect.any(Date),
        payload: { id: 'id' },
      },
      originalError: {
        name: 'Error',
        message: 'test',
        stack: expect.any(String),
      },
    });
  });

  it('deveria disparar um evento (async) que lança um erro e não propaga para o chamador e verificar se realizou o log', async () => {
    const eventName = 'test';
    const loggerSpy = vi.spyOn((eventManager as any).logger, 'error');

    const handler = vi.fn();
    handler.mockImplementation(async () => {
      throw new Error('test');
    });

    eventManager.register(eventName, handler);
    expect(() => eventManager.dispatch(eventName, { id: 'id' })).not.toThrow();
    expect(handler).toBeCalledTimes(1);

    await Utils.sleep(10);

    expect(loggerSpy).toBeCalledTimes(1);
    expect(loggerSpy).toBeCalledWith('DISPATCH_ERROR', {
      event: {
        name: eventName,
        createdAt: expect.any(Date),
        payload: { id: 'id' },
      },
      originalError: {
        name: 'Error',
        message: 'test',
        stack: expect.any(String),
      },
    });
  });

  it('deveria tentar remover um evento que não existe', () => {
    expect(() => eventManager.remove('test', vi.fn())).not.toThrowError();
  });

  it('deveria tentar disparar um evento que não existe', () => {
    expect(() => eventManager.dispatch('test', vi.fn())).not.toThrowError();
  });
});
