export { Container } from './container';

export enum ContainerName {
  JWT = '_jwt_',
  LOGGER = '_logger_',
  TRANSLATION = '_translation_',
  CACHE_CLIENT = '_cache_client_',
  EVENT_MANAGER = '_event_manager_',
  REQUEST_ID = '_request_id_',
  PG_POOL = '_pg_pool_',
}

export type ContainerValue = ((container: ContainerInterface) => void) | any;

export interface ContainerInterface {
  get<T = any>(id: string): T;
  set(id: string, value: ContainerValue): void;
  clone(): ContainerInterface;
  has(id: string): boolean;
}
