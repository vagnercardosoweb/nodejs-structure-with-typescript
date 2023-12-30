import { Common } from '@/shared/common';
import { InternalServerError } from '@/shared/errors';
import { EventManager } from '@/shared/event-manager';
import { Logger } from '@/shared/logger';

let eventManager: EventManager;

describe('shared/event-manager', () => {
  beforeEach(() => {
    eventManager = new EventManager(new Logger('test'));
  });

  it('should register an event', () => {
    const handler = vi.fn();
    const eventName = 'test';
    eventManager.register(eventName, handler);
    const handlers = (eventManager as any).handlers;
    expect(handlers[eventName]).toHaveLength(1);
    expect(handlers[eventName][0]).toStrictEqual(handler);
  });

  it('should remove the registered events', () => {
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
    expect(handlers).toStrictEqual({});
  });

  it('should throw an error when registering more than one event with the same handler', () => {
    const handler = vi.fn();
    const eventName = 'test';
    eventManager.register(eventName, handler);
    expect(() => eventManager.register(eventName, handler)).toThrowError(
      new InternalServerError({
        code: 'EVENT_MANAGER_ALREADY_REGISTERED',
        message: `The handler for the event "${eventName}" has already been registered`,
      }),
    );
  });

  it('should clear all events', () => {
    const handler = vi.fn();
    const handler2 = vi.fn();
    const eventName = 'test';

    eventManager.register(eventName, handler);
    eventManager.register(eventName, handler2);

    eventManager.clear();
    expect((eventManager as any).handlers).toStrictEqual({});
  });

  it('should register an event and trigger it', () => {
    const handler = vi.fn();
    const eventName = 'test';

    eventManager.register(eventName, handler);
    eventManager.dispatchAsync(eventName, { id: 'id' });

    expect(handler).toBeCalledTimes(1);
    expect(handler).toBeCalledWith({
      name: eventName,
      createdAt: expect.any(Date),
      payload: { id: 'id' },
    });
  });

  it('should execute the "dispatchSync" method and return the handler result', async () => {
    const eventName = 'test';

    const fn1 = vi.fn();
    fn1.mockReturnValue('id');

    const fn2 = vi.fn();
    fn2.mockResolvedValue([{ id: 'id' }]);

    const fn3 = vi.fn();
    fn3.mockReturnValue({ id: 'id' });

    eventManager.register(eventName, fn1);
    eventManager.register(eventName, fn2);
    eventManager.register(eventName, fn3);

    const payload = { id: 'id' };
    const [res1, res2, res3] = await eventManager.dispatchSync(
      eventName,
      payload,
    );

    expect(fn1).toBeCalledTimes(1);
    expect(fn2).toBeCalledTimes(1);
    expect(fn3).toBeCalledTimes(1);

    expect(fn1).toBeCalledWith({
      name: eventName,
      createdAt: expect.any(Date),
      payload,
    });

    expect(fn2).toBeCalledWith({
      name: eventName,
      createdAt: expect.any(Date),
      payload,
    });

    expect(fn2).toBeCalledWith({
      name: eventName,
      createdAt: expect.any(Date),
      payload,
    });

    expect(res1).toBe(payload.id);
    expect(res2).toStrictEqual([payload]);
    expect(res3).toStrictEqual(payload);
  });

  it('deveria retornar um array vázio se o método "dispatchSync" for chamado com um evento que não existe', async () => {
    const eventName = 'test';
    const payload = { id: 'id' };
    const result = await eventManager.dispatchSync(eventName, payload);
    expect(result).toStrictEqual([]);
  });

  it('should trigger an event (sync) that throws an error and does not propagate to the caller and check if the log was performed', () => {
    const eventName = 'test';
    const loggerSpy = vi.spyOn((eventManager as any).logger, 'error');

    const handler = vi.fn();
    const error = new Error('test');
    handler.mockImplementation(() => {
      throw error;
    });

    eventManager.register(eventName, handler);
    expect(() =>
      eventManager.dispatchAsync(eventName, { id: 'id' }),
    ).not.toThrow();
    expect(handler).toBeCalledTimes(1);

    expect(loggerSpy).toBeCalledTimes(1);
    expect(loggerSpy).toBeCalledWith('DISPATCH_ERROR', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      event: {
        name: eventName,
        createdAt: expect.any(Date),
        payload: { id: 'id' },
      },
    });
  });

  it('should trigger an event (async) that throws an error and does not propagate to the caller and check if the log was performed', async () => {
    const eventName = 'test';
    const loggerSpy = vi.spyOn((eventManager as any).logger, 'error');

    const handler = vi.fn();
    handler.mockImplementation(async () => {
      throw new Error('test');
    });

    eventManager.register(eventName, handler);
    expect(() =>
      eventManager.dispatchAsync(eventName, { id: 'id' }),
    ).not.toThrow();
    expect(handler).toBeCalledTimes(1);

    await Common.sleep(0);

    expect(loggerSpy).toBeCalledTimes(1);
    expect(loggerSpy).toBeCalledWith('DISPATCH_ERROR', {
      event: {
        name: eventName,
        createdAt: expect.any(Date),
        payload: { id: 'id' },
      },
      error: {
        name: 'Error',
        message: 'test',
        stack: expect.any(String),
      },
    });
  });

  it('should try to remove an event that does not exist', () => {
    expect(() => eventManager.remove('test', vi.fn())).not.toThrowError();
  });

  it("should try to trigger an event that doesn't exist", () => {
    expect(() =>
      eventManager.dispatchAsync('test', vi.fn()),
    ).not.toThrowError();
  });
});
