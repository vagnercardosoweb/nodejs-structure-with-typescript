export { Container } from './container';

export enum ContainerName {
  JWT = '_jwt_',
  PORT = '_port_',
  APP_KEY = '_app_key_',
  LOGGER = '_logger_',
  TRANSLATION = '_translation_',
  CACHE_CLIENT = '_cache_client_',
  PASSWORD_HASH = '_password_hash_',
  EVENT_MANAGER = '_event_manager_',
  SERVER_ID = '_server_id_',
  REQUEST_ID = '_request_id_',
  PG_POOL = '_pg_pool_',
}

export type ContainerValue = ((container: ContainerInterface) => void) | any;

export interface ContainerInterface {
  get<T = any>(name: ContainerName): T;
  set(name: ContainerName, value: ContainerValue): void;
  clone(): ContainerInterface;
  has(name: ContainerName): boolean;
}
