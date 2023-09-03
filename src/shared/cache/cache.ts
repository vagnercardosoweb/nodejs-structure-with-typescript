import { LoggerInterface } from '@/shared';

export interface CacheInterface {
  set<T>(key: string, value: T, expireInSeconds?: number): Promise<void>;
  get<T>(
    key: string,
    defaultValue?: CacheDefaultValue<T>,
    expireInSeconds?: number,
  ): Promise<T | null>;
  withLogger(logger: LoggerInterface): CacheInterface;
  getLogger(): LoggerInterface;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<boolean>;
}

export type CacheDefaultValue<T> =
  | (() => Promise<T> | T)
  | Record<string, any>
  | string
  | number
  | boolean
  | null
  | [];
