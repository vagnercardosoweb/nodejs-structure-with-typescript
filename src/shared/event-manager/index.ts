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
  dispatch<T>(eventName: string, payload: T): void;
  remove<T>(eventName: string, handler: EventManagerHandler<T>): void;
  clear(): void;
}
