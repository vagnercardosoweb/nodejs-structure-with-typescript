import { Pool, PoolClient, types } from 'pg';

import {
  DurationTime,
  Env,
  InternalServerError,
  LoggerInterface,
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
  protected readonly pool: Pool;
  protected closed = false;

  public constructor(
    protected logger: LoggerInterface,
    protected readonly options: PgPoolConnectionOptions,
  ) {
    this.pool = new Pool({
      host: this.options.host,
      port: this.options.port,
      database: this.options.database,
      user: this.options.username,
      password: this.options.password,
      application_name: this.options.appName,
      min: this.options.minPool,
      max: this.options.maxPool,
      ssl: this.options.enabledSsl ? { rejectUnauthorized: false } : undefined,
      query_timeout: options.timeout.query,
      connectionTimeoutMillis: options.timeout.connection,
      idleTimeoutMillis: options.timeout.idle,
      allowExitOnIdle: true,
    });

    if (!this.options.convertDateOnlyToDate) {
      types.setTypeParser(1082, (value) => value);
    }
  }

  public static fromEnvironment(logger: LoggerInterface): PgPool {
    return new PgPool(logger, {
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
      convertDateOnlyToDate: Env.get('DB_CONVERT_DATE_ONLY_TO_DATE', false),
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
    this.logger.info('DB_CLOSING');
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
    transaction.onFinish(() => this.release());
    await transaction.begin();
    return transaction;
  }

  public async query<T extends QueryResultRow = any>(
    query: string,
    bind: any[] = [],
  ): Promise<QueryResult<T>> {
    const client = this.getClient();
    query = Utils.normalizeSqlQuery(query);
    const metadata = {
      name: this.options.appName,
      type: this.client !== null ? 'TX' : 'POOL',
      duration: '0ms',
      query,
      bind,
    };
    const duration = new DurationTime();
    try {
      const result = await client.query<T>(query, bind);
      metadata.duration = duration.format();
      if (this.options.logging) this.logger.info('DB_QUERY', metadata);
      return {
        oid: result.oid,
        rows: result.rows,
        rowCount: result.rowCount,
        command: result.command,
        duration: metadata.duration,
        fields: result.fields,
        query,
        bind,
      };
    } catch (e: any) {
      metadata.duration = duration.format();
      throw new InternalServerError({
        originalError: e,
        metadata,
      });
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

  protected release() {
    if (this.client === null) return;
    this.logger.info('DB_RELEASING');
    this.client.release();
    this.client = null;
  }

  protected getClient() {
    return this.client ?? this.pool;
  }
}
