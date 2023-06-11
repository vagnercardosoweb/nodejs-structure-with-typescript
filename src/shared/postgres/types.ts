import {
  QueryResult as PgQueryResult,
  QueryResultRow as PgQueryResultRow,
} from 'pg';

import { TransactionInterface } from '@/shared';

export interface DbConnectionInterface {
  query<T extends QueryResultRow = any>(
    query: string,
    bind?: any[],
  ): Promise<QueryResult<T>>;

  withLoggerId(requestId: string): DbConnectionInterface;

  createTransaction(): Promise<TransactionInterface>;

  createTransactionManaged<T>(fn: FnTransaction<T>): Promise<T>;

  connect(): Promise<DbConnectionInterface>;

  close(): Promise<void>;
}

export type FnTransaction<T> = (
  connection: Omit<
    DbConnectionInterface,
    'createTransaction' | 'createTransactionManaged'
  >,
) => Promise<T>;

export type PgPoolConnectionOptions = {
  host: string;
  port?: number;
  schema?: string;
  database: string;
  username: string;
  password: string;
  timezone?: string;
  charset?: string;
  minPool?: number;
  maxPool?: number;
  appName: string;
  logging: boolean;
  enabledSsl: boolean;
  /**
   * Timeout in ms
   */
  timeout?: {
    idle?: number;
    connection?: number;
    query?: number;
  };
};

export type QueryResultRow = PgQueryResultRow;
export type QueryResult<T extends QueryResultRow> = PgQueryResult<T> & {
  query: string;
  bind: any[];
};
