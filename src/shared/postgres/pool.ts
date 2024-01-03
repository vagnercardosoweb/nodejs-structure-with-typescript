import { Pool, PoolClient, types } from 'pg';

import { Common } from '@/shared/common';
import { DurationTime } from '@/shared/duration-time';
import { HttpStatusCode } from '@/shared/enums';
import { Env } from '@/shared/env';
import { AppError } from '@/shared/errors';
import { LoggerInterface, LoggerMetadata, LogLevel } from '@/shared/logger';
import {
  FnTransaction,
  PgPoolInterface,
  PgPoolOptions,
  QueryResult,
  QueryResultRow,
  Transaction,
  TransactionInterface,
} from '@/shared/postgres';

export class PgPool implements PgPoolInterface {
  protected client: PoolClient | null = null;
  protected hasCloned = false;
  protected readonly pool: Pool;
  protected closed = false;

  public constructor(
    protected logger: LoggerInterface,
    protected readonly options: PgPoolOptions,
  ) {
    this.pool = new Pool({
      host: this.options.host,
      port: this.options.port,
      database: this.options.database,
      user: this.options.username,
      password: this.options.password,
      application_name: this.options.appName,
      query_timeout: this.options.timeout.query,
      connectionTimeoutMillis: this.options.timeout.connection,
      idleTimeoutMillis: this.options.timeout.idle,
      ssl: this.options.enabledSsl ? { rejectUnauthorized: false } : undefined,
      options: `-c search_path=${this.options.schema}`,
      allowExitOnIdle: true,
      min: this.options.minPool,
      max: this.options.maxPool,
    });

    if (!this.options.convertDateOnlyToDate) {
      types.setTypeParser(1082, (value) => value);
    }
  }

  public static fromEnvironment(logger: LoggerInterface): PgPool {
    return new PgPool(logger, {
      appName: Env.required('DB_APP_NAME'),
      charset: Env.get('DB_CHARSET', 'utf8'),
      database: Env.required('DB_NAME'),
      enabledSsl: Env.get('DB_ENABLED_SSL', false),
      host: Env.required('DB_HOST'),
      logging: Env.required('DB_LOGGING', true),
      maxPool: Env.get('DB_POOL_MAX', 35),
      minPool: Env.get('DB_POOL_MIN', 0),
      password: Env.required('DB_PASSWORD'),
      port: Env.get('DB_PORT', 5432),
      schema: Env.get('DB_SCHEMA', 'public'),
      timezone: Env.get('DB_TIMEZONE', 'UTC'),
      convertDateOnlyToDate: Env.get('DB_CONVERT_DATE_ONLY_TO_DATE', false),
      username: Env.required('DB_USERNAME'),
      timeout: {
        idle: Env.get('DB_POOL_IDLE', 1_000),
        connection: Env.get('DB_POOL_EVICT', 2_000),
        query: Env.get('DB_POOL_ACQUIRE', 3_000),
      },
    });
  }

  public withLogger(logger: LoggerInterface): PgPool {
    const instance = this.clone();
    instance.logger = logger;
    return instance;
  }

  public getLogger(): LoggerInterface {
    return this.logger;
  }

  public async close(): Promise<void> {
    if (this.closed) return;
    this.log(LogLevel.INFO, 'closing');
    await this.pool.end();
    this.closed = true;
  }

  public async connect(): Promise<PgPoolInterface> {
    this.log(LogLevel.INFO, 'connecting');
    await this.query('SELECT 1 + 1;');
    return this;
  }

  public async query<T extends QueryResultRow = any>(
    query: string,
    bind: any[] = [],
  ): Promise<QueryResult<T>> {
    const client = this.client ?? this.pool;
    query = Common.normalizeSqlQuery(query);
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
      this.log(LogLevel.INFO, 'query', metadata);

      let rowCount = 0;
      if (result.rowCount !== undefined) {
        rowCount = result.rowCount!;
      } else if (!Array.isArray(result)) {
        rowCount = result.rows.length;
      }

      return {
        oid: result.oid,
        rows: result.rows,
        rowCount,
        command: result.command,
        duration: metadata.duration,
        fields: result.fields,
        query,
        bind,
      };
    } catch (e: any) {
      metadata.duration = duration.format();
      this.log(LogLevel.ERROR, 'query', metadata);
      throw new AppError({
        code: e.code,
        statusCode:
          e.code === '23505'
            ? HttpStatusCode.CONFLICT
            : HttpStatusCode.INTERNAL_SERVER_ERROR,
        originalError: e,
        metadata,
      });
    }
  }

  public async createTransaction(): Promise<TransactionInterface> {
    this.client = await this.pool.connect();
    const transaction = new Transaction(this);
    await transaction.begin();
    return transaction;
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

  public release() {
    if (this.client === null) return;
    this.log(LogLevel.INFO, 'release');
    this.client.release();
    this.client = null;
  }

  protected log(level: LogLevel, message: string, metadata?: LoggerMetadata) {
    if (!this.options.logging) return;
    this.logger.log(level, message, metadata);
  }

  protected clone(): PgPool {
    if (this.hasCloned) return this;
    const cloned = Common.cloneObject(this);
    cloned.hasCloned = true;
    return cloned;
  }
}
