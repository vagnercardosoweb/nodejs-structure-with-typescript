import { InternalServerError, Logger, LoggerInterface, Utils } from '@/shared';

interface Event<T> {
  name: string;
  createdAt: Date;
  payload: T;
}

type Handler = (event: Event<any>) => Promise<void> | void;

export interface EventManagerInterface {
  register(eventName: string, handler: Handler): void;
  dispatch<T>(eventName: string, payload: T): void;
  remove(eventName: string, handler: Handler): void;
  clear(): void;
}

export class EventManager implements EventManagerInterface {
  protected handlers: Record<string, Handler[]> = {};
  protected logger: LoggerInterface = Logger.withId('EVENT_MANAGER');

  public register(eventName: string, handler: Handler): void {
    if (!this.handlers[eventName]) this.handlers[eventName] = [];

    if (this.handlers[eventName].includes(handler)) {
      throw new InternalServerError({
        message:
          'The handler for the event "{{eventName}}" has already been registered',
        metadata: { eventName },
      });
    }

    this.handlers[eventName].push(handler);
  }

  public dispatch<T>(eventName: string, payload: T): void {
    if (!this.handlers[eventName]) return;

    for (const handler of this.handlers[eventName]) {
      const event = {
        name: eventName,
        createdAt: Utils.createUtcDate(),
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

  public remove(eventName: string, handler: Handler): void {
    if (!this.handlers[eventName]) return;

    const filterFn = (h: Handler) => h !== handler;
    this.handlers[eventName] = this.handlers[eventName].filter(filterFn);

    if (!this.handlers[eventName].length) delete this.handlers[eventName];
  }

  public clear(): void {
    this.handlers = {};
  }

  protected logError(event: Event<any>, err: any): void {
    this.logger.error('DISPATCH', {
      event,
      originalError: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
    });
  }
}
