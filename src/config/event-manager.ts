import { EventManager } from '@/shared/event-manager';
import { LoggerInterface } from '@/shared/logger';

export const setupEventManager = (logger: LoggerInterface) => {
  logger.info('setup event manager');
  const eventManager = new EventManager(logger);
  // eventManager.register('EVENT_NAME', (event) => {});
  return eventManager;
};
