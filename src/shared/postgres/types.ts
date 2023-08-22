import {
  QueryResult as PgQueryResult,
  QueryResultRow as PgQueryResultRow,
} from 'pg';

import { TransactionInterface } from '@/shared';

export interface PgPoolInterface {
  query<T extends QueryResultRow = any>(
    query: string,
    bind?: any[],
  ): Promise<QueryResult<T>>;
  withLoggerId(requestId: string): PgPoolInterface;
  createTransaction(): Promise<TransactionInterface>;
  createTransactionManaged<T>(fn: FnTransaction<T>): Promise<T>;
  release(): void;
  connect(): Promise<PgPoolInterface>;
  close(): Promise<void>;
}

export type FnTransaction<T> = (
  connection: Omit<
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
