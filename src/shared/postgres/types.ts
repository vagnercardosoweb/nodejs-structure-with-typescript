import {
  QueryResult as PgQueryResult,
  QueryResultRow as PgQueryResultRow,
} from 'pg';

import { LoggerInterface } from '@/shared';

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
    query: string,
    bind?: any[],
  ): Promise<QueryResult<T>>;
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

export type QueryResultRow = PgQueryResultRow;
export type QueryResult<T extends QueryResultRow> = PgQueryResult<T> & {
  bind: any[];
  duration: string;
  query: string;
};
