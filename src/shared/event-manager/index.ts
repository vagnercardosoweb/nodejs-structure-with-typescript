export { EventManager } from './event-manager';

export interface EventManagerInput<T> {
  name: string;
  createdAt: Date;
  payload: T & { $logId?: string };
}

export type EventManagerHandler<T> = (
  event: EventManagerInput<T>,
) => Promise<void> | void;

export interface EventManagerInterface {
  register<T>(eventName: string, handler: EventManagerHandler<T>): void;
  dispatchAsync<T>(eventName: string, payload: T): void;
  dispatchSync<T, R>(eventName: string, payload: T): Promise<R[]>;
  remove<T>(eventName: string, handler: EventManagerHandler<T>): void;
  clear(): void;
}
