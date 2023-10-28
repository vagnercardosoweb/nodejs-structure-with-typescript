import { EventManager } from '@/shared';

export const setupEventManager = () => {
  const eventManager = new EventManager();
  // eventManager.register('EVENT_NAME', (event) => {});
  return eventManager;
};
