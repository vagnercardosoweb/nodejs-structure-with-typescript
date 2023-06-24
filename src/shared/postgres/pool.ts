import { Pool, PoolClient } from 'pg';

import {
  DurationTime,
  Env,
  InternalServerError,
  Logger,
  LoggerInterface,
  LogLevel,
  Transaction,
  TransactionInterface,
  Utils,
} from '@/shared';

import {
  FnTransaction,
  PgPoolConnectionOptions,
  PgPoolInterface,
  QueryResult,
  QueryResultRow,
} from './types';

export class PgPool implements PgPoolInterface {
  protected client: PoolClient | null = null;
  protected configured = false;
  protected readonly pool: Pool;
  protected closed = false;

  public constructor(
    protected logger: LoggerInterface,
    protected readonly options: PgPoolConnectionOptions,
  ) {
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
    return new PgPool(Logger.withId('DB_POOL'), {
      appName: Env.get('DB_APP_NAME', 'api'),
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
    let isError = false;
    query = Utils.removeLinesAndSpaceFromSql(query);

    const duration = new DurationTime();
    const client = await this.getClient();
    const metadata = {
      name: this.options.appName.toLowerCase(),
      type: this.client !== null ? 'transaction' : 'pool',
      duration: '',
      query,
      bind,
    };

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
      metadata.duration = duration.format();
      throw new InternalServerError({
        message: 'DB_QUERY',
        original: e,
        metadata,
      });
    } finally {
      if (this.options.logging) {
        metadata.duration = duration.format();
        this.logger.log(
          isError ? LogLevel.ERROR : LogLevel.INFO,
          'DB_QUERY',
          metadata,
        );
      }
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
      const query = [
        `SET timezone TO '${this.options.timezone}';`,
        `SET client_encoding TO '${this.options.charset}';`,
        `SET search_path TO '${this.options.schema}';`,
      ];
      await client.query(query.join(''));
      this.configured = true;
    }

    return client;
  }
}
