import { InternalServerError } from '@/shared/errors';
import {
  EventManagerHandler,
  EventManagerInput,
  EventManagerInterface,
} from '@/shared/event-manager';
import { LoggerInterface } from '@/shared/logger';

export class EventManager implements EventManagerInterface {
  protected handlers: Record<string, EventManagerHandler<any>[]> = {};

  public constructor(protected readonly logger: LoggerInterface) {}

  public register<T>(eventName: string, handler: EventManagerHandler<T>): void {
    if (!this.handlers[eventName]) this.handlers[eventName] = [];

    if (this.handlers[eventName].includes(handler)) {
      throw new InternalServerError({
        message: `The handler for the event "${eventName}" has already been registered`,
        code: 'EVENT_MANAGER_ALREADY_REGISTERED',
      });
    }

    this.handlers[eventName].push(handler);
  }

  public async dispatchSync<T, R>(eventName: string, payload: T): Promise<R[]> {
    if (!this.handlers[eventName]) return [];
    const results: R[] = [];

    for (const handler of this.handlers[eventName]) {
      let result = handler({
        name: eventName,
        createdAt: new Date(),
        payload,
      });

      const isPromise = result instanceof Promise;
      if (isPromise) result = await result;
      results.push(result as R);
    }

    return results;
  }

  public dispatchAsync<T>(eventName: string, payload: T): void {
    if (!this.handlers[eventName]) return;

    for (const handler of this.handlers[eventName]) {
      const event = {
        name: eventName,
        createdAt: new Date(),
        payload,
      };

      try {
        const result = handler(event);
        const isPromise = result instanceof Promise;
        if (isPromise) result.catch((err) => this.logError(event, err));
      } catch (err) {
        this.logError(event, err);
      }
    }
  }

  public remove<T>(eventName: string, handler: EventManagerHandler<T>): void {
    if (!this.handlers[eventName]) return;

    const filterFn = (h: EventManagerHandler<T>) => h !== handler;
    this.handlers[eventName] = this.handlers[eventName].filter(filterFn);

    if (!this.handlers[eventName].length) delete this.handlers[eventName];
  }

  public clear(): void {
    this.handlers = {};
  }

  protected logError(event: EventManagerInput<any>, error: any): void {
    const logId = event.payload?.$logId;
    delete event.payload?.$logId;

    this.logger.error('DISPATCH_ERROR', {
      event,
      $logId: logId,
      error: {
        ...error,
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }
}
