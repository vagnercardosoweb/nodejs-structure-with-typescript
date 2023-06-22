import { Pool, PoolClient } from 'pg';

import {
  Env,
  InternalServerError,
  Logger,
  LoggerInterface,
  LogLevel,
  Transaction,
  TransactionInterface,
  Utils,
} from '@/shared';

import { QueryMensure } from './query-mensure';
import {
  FnTransaction,
  PgPoolConnectionOptions,
  PgPoolInterface,
  QueryResult,
  QueryResultRow,
} from './types';

export class PgPool implements PgPoolInterface {
  protected logger: LoggerInterface;
  protected client: PoolClient | null = null;
  protected configured = false;
  protected readonly pool: Pool;
  protected closed = false;

  public constructor(protected readonly options: PgPoolConnectionOptions) {
    this.logger = Logger.withId('DATABASE');
    this.pool = new Pool({
      host: this.options.host,
      port: this.options?.port ?? 5432,
      database: this.options.database,
      user: this.options.username,
      password: this.options.password,
      application_name: this.options.appName,
      min: this.options?.minPool ?? 0,
      max: this.options?.maxPool ?? 35,
      query_timeout: options.timeout?.query ?? 3_000,
      connectionTimeoutMillis: options.timeout?.connection ?? 2_000,
      idleTimeoutMillis: options.timeout?.idle ?? 30_000,
      allowExitOnIdle: true,
      ssl: this.options.enabledSsl ? { rejectUnauthorized: false } : undefined,
    });
  }

  public static fromEnvironment(): PgPool {
    return new PgPool({
      appName: Env.get('DB_APP_NAME', 'typescript-structure'),
      charset: Env.get('DB_CHARSET', 'utf8'),
      database: Env.required('DB_NAME'),
      enabledSsl: Env.get('DB_ENABLED_SSL', false),
      host: Env.required('DB_HOST'),
      logging: Env.required('DB_LOGGING', false),
      maxPool: Env.get('DB_POOL_MAX', 35),
      minPool: Env.get('DB_POOL_MIN', 0),
      password: Env.required('DB_PASSWORD'),
      port: Env.get('DB_PORT', 5432),
      schema: Env.get('DB_SCHEMA', 'public'),
      timezone: Env.get('DB_TIMEZONE', 'UTC'),
      username: Env.required('DB_USERNAME'),
      timeout: {
        idle: Env.get('DB_POOL_IDLE', 30_000),
        connection: Env.get('DB_POOL_EVICT', 2_000),
        query: Env.get('DB_POOL_ACQUIRE', 3_000),
      },
    });
  }

  public withLoggerId(id: string): PgPool {
    const clone = Utils.cloneObject(this);
    clone.logger = this.logger.withId(id);
    return clone;
  }

  public async close(): Promise<void> {
    if (this.closed) return;
    this.logger.info('CLOSING');
    await this.pool.end();
    this.closed = true;
  }

  public async connect(): Promise<PgPoolInterface> {
    this.logger.info('CONNECTING');
    await this.query('SELECT 1 + 1;');
    return this;
  }

  public async createTransaction(): Promise<TransactionInterface> {
    this.client = await this.pool.connect();
    const transaction = new Transaction(this);
    transaction.onFinish(() => {
      this.logger.info('RELEASING');
      this.client?.release();
      this.client = null;
    });
    await transaction.begin();
    return transaction;
  }

  public async query<T extends QueryResultRow = any>(
    query: string,
    bind: any[] = [],
  ): Promise<QueryResult<T>> {
    query = Utils.removeLinesAndSpaceFromSql(query);

    const mensure = new QueryMensure();
    const client = await this.getClient();
    let isError = false;

    try {
      const result = await client.query<T>(query, bind);
      return {
        oid: result.oid,
        rows: result.rows,
        rowCount: result.rowCount,
        command: result.command,
        query,
        bind,
        fields: result.fields,
      };
    } catch (e: any) {
      isError = true;
      throw new InternalServerError({
        message: 'QUERY_ERROR',
        original: e,
        metadata: {
          query,
          duration: mensure.format(),
          bind,
        },
      });
    } finally {
      this.logQuery(mensure.format(), query, bind, isError);
    }
  }

  public async createTransactionManaged<T>(fn: FnTransaction<T>): Promise<T> {
    const transaction = await this.createTransaction();
    try {
      const result = await fn(this);
      await transaction.commit();
      return result;
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  protected async getClient() {
    const client = this.client ?? this.pool;

    if (!this.configured) {
      this.logger.info('setting timezone, encoding and search path', {
        schema: this.options.schema,
        timezone: this.options.timezone,
        charset: this.options.charset,
      });

      await client.query(`
        SET timezone TO '${this.options.timezone}';
        SET client_encoding TO '${this.options.charset}';
        SET search_path TO '${this.options.schema}';
      `);

      this.configured = true;
    }

    return client;
  }

  protected logQuery(
    duration: string,
    query: string,
    bind: any[],
    isError: boolean,
  ) {
    if (!this.options.logging) return;
    this.logger.log(isError ? LogLevel.ERROR : LogLevel.INFO, 'QUERY', {
      name: this.options.appName.toLowerCase(),
      type: this.client !== null ? 'client' : 'pool',
      duration,
      query,
      bind,
    });
  }
}
