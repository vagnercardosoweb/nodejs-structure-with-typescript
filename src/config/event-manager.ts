import { EventManager } from '@/shared/event-manager';

export const setupEventManager = () => {
  const eventManager = new EventManager();
  // eventManager.register('EVENT_NAME', (event) => {});
  return eventManager;
};
