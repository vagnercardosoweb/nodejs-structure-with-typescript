import { QueryResultBase } from 'pg';

import { LoggerInterface } from '@/shared/logger';

export type HandleHook = (pgPool: PgPoolInterface) => Promise<void> | void;

export interface TransactionInterface {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  afterRollback(handle: HandleHook): void;
  afterCommit(handle: HandleHook): void;
}

export interface PgPoolInterface {
  query<T extends QueryResultRow = any>(
    input: QueryInput,
  ): Promise<QueryResult<T>>;
  query<T extends QueryResultRow = any>(
    query: string,
    values?: any[],
  ): Promise<QueryResult<T>>;
  query<T extends any[] = any[]>(
    input: QueryArrayInput,
  ): Promise<QueryResult<T[number]>[]>;
  createTransaction(): Promise<TransactionInterface>;
  createTransactionManaged<T>(fn: FnTransaction<T>): Promise<T>;
  withLogger(logger: LoggerInterface): PgPoolInterface;
  getLogger(): LoggerInterface;
  release(): void;
  connect(): Promise<PgPoolInterface>;
  close(): Promise<void>;
}

export type FnTransaction<T> = (
  pgPool: Omit<
    PgPoolInterface,
    'createTransaction' | 'createTransactionManaged'
  >,
) => Promise<T>;

export type PgPoolOptions = {
  host: string;
  port: number;
  schema: string;
  database: string;
  username: string;
  password: string;
  timezone: string;
  charset: string;
  enabledSsl: boolean;
  convertDateOnlyToDate: boolean;
  maxPool: number;
  minPool: number;
  logging: boolean;
  appName: string;
  /**
   * Timeout in ms
   */
  timeout: {
    idle: number;
    connection: number;
    query: number;
  };
};

export type QueryResultRow = Record<string, any>;

export type QueryInput = {
  query: string;
  values?: any[];
  logging?: boolean;
  logId?: string;
};

export type QueryArrayInput = QueryInput & {
  multiple: true;
};

export type QueryMetadata = {
  name: string;
  duration: string;
  values: any[];
  logging: boolean;
  query: string;
  logId?: string;
  type: 'TX' | 'POOL';
};

export type QueryResult<T extends QueryResultRow = any> = QueryResultBase & {
  values: any[];
  rowCount: number;
  duration: string;
  query: string;
  rows: T[];
};
