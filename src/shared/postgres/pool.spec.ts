import os from 'node:os';
import process from 'node:process';

import { DatabaseError, Pool, PoolClient, types } from 'pg';
import { describe, Mocked, vi } from 'vitest';

import { DurationTime } from '@/shared/duration-time';
import { Logger, LoggerInterface, LogLevel } from '@/shared/logger';
import { PgPool, PgPoolInterface, PgPoolOptions } from '@/shared/postgres';

import { HttpStatusCode } from '../enums';
import { AppError, INTERNAL_SERVER_ERROR_MESSAGE } from '../errors';

const mockQueryResult = {
  command: 'SELECT',
  duration: '0ms',
  fields: [
    {
      columnID: 0,
      dataTypeID: 23,
      dataTypeModifier: -1,
      dataTypeSize: 4,
      format: 'text',
      name: '?column?',
      tableID: 0,
    },
  ],
  oid: null,
  query: 'SELECT 1 + 1;',
  rowCount: 1,
  rows: [
    {
      '?column?': 2,
    },
  ],
  values: [],
};

vi.mock('pg', async () => {
  return {
    types: { setTypeParser: vi.fn() },
    Pool: vi.fn().mockImplementation(() => {
      return {
        query: vi.fn().mockResolvedValue(mockQueryResult),
        connect: vi.fn().mockResolvedValue({
          query: vi.fn().mockResolvedValue(mockQueryResult),
          release: vi.fn(),
        }),
        end: vi.fn(),
      };
    }),
  };
});

const pgOptions: PgPoolOptions = {
  host: 'localhost',
  port: 5432,
  database: 'test',
  username: 'postgres',
  password: 'postgres',
  appName: 'test',
  minPool: 0,
  maxPool: 10,
  charset: 'utf8',
  schema: 'public',
  logging: true,
  timezone: 'UTC',
  enabledSsl: false,
  convertDateOnlyToDate: false,
  timeout: {
    idle: 1000,
    connection: 1000,
    query: 1000,
  },
};

interface PgPoolMockInterface extends PgPoolInterface {
  closed: boolean;
  logger: LoggerInterface;
  hasCloned: boolean;
  client: Mocked<PoolClient>;
  pool: Mocked<Pool>;
}

const newPgPoolWithOptions = (options: PgPoolOptions): PgPoolMockInterface => {
  return new PgPool(
    new Logger('PG'),
    options,
  ) as unknown as PgPoolMockInterface;
};

const expectPoolConstructor = {
  allowExitOnIdle: true,
  application_name: 'test',
  connectionTimeoutMillis: 1000,
  database: 'test',
  host: 'localhost',
  idleTimeoutMillis: 1000,
  max: 10,
  min: 0,
  options: '-c search_path="public"',
  password: 'postgres',
  port: 5432,
  query_timeout: 1000,
  ssl: undefined,
  user: 'postgres',
};

describe('shared/postgres/pool', () => {
  let pgPool: PgPoolMockInterface;

  beforeEach(() => {
    pgPool = newPgPoolWithOptions(pgOptions);
  });

  afterEach(async () => {
    await pgPool.close();
  });

  it('should create an instance with all properties defined without ssl', () => {
    expect(Pool).toHaveBeenCalledWith(expectPoolConstructor);
    expect(types.setTypeParser).toHaveBeenCalledWith(
      1082,
      expect.any(Function),
    );
  });

  it('should create an instance with all properties defined with ssl', () => {
    vi.clearAllMocks();
    pgPool = newPgPoolWithOptions({
      ...pgOptions,
      convertDateOnlyToDate: true,
      enabledSsl: true,
    });
    expect(types.setTypeParser).not.toHaveBeenCalled();
    expect(Pool).toHaveBeenCalledWith({
      ...expectPoolConstructor,
      ssl: { rejectUnauthorized: false },
    });
  });

  it('should test the "withLogger" method with a different logger', () => {
    const logger = new Logger('ANY_ID');
    expect(pgPool.hasCloned).toBeFalsy();
    const instance = pgPool.withLogger(logger) as PgPoolMockInterface;
    expect(instance.hasCloned).toBeTruthy();
    expect(pgPool).not.toBe(instance);
    expect(instance).toStrictEqual(instance.withLogger(logger));
    expect(instance.getLogger()).toBe(logger);
    expect(instance.getLogger().getId()).toBe('ANY_ID');
  });

  it('should test the "close" method successfully', async () => {
    expect(pgPool.closed).toBe(false);
    await pgPool.close();

    expect(pgPool.pool.end).toHaveBeenCalledTimes(1);
    pgPool.pool.end.mockClear();

    expect(pgPool.closed).toBe(true);
    await pgPool.close();
    expect(pgPool.pool.end).toHaveBeenCalledTimes(0);
  });

  it('should test the "connect" method successfully', async () => {
    const connectedPgPool = await pgPool.connect();
    expect(connectedPgPool).toBe(pgPool);

    expect(pgPool.pool.query).toHaveBeenCalledWith('SELECT 1 + 1;', []);
    expect(pgPool.pool.query).toHaveBeenCalledTimes(1);
  });

  it('should test the "createTransaction" method successfully and perform the "commit"', async () => {
    const transaction = await pgPool.createTransaction();
    await transaction.begin();
    const pgPoolClient = pgPool.client;

    const query = 'UPDATE tb SET id = 1 WHERE id = 1;';

    try {
      await pgPool.query(query);
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }

    expect(pgPoolClient.query).toHaveBeenCalledWith('BEGIN', []);
    expect(pgPoolClient.query).toHaveBeenCalledWith('COMMIT', []);
    expect(pgPoolClient.query).toHaveBeenCalledWith(query, []);

    expect(pgPoolClient.release).toHaveBeenCalledTimes(1);
    expect(pgPoolClient.query).toHaveBeenCalledTimes(3);

    expect(pgPool.client).toBeNull();
  });

  it('should test the "createTransaction" method successfully and perform the "rollback"', async () => {
    const transaction = await pgPool.createTransaction();

    const pgPoolClient = pgPool.client;
    const expectedError = new Error('any error');
    pgPoolClient.query.mockRejectedValueOnce(expectedError);

    const query = 'DELETE FROM tb WHERE id = 1;';
    let throwError: AppError | undefined;

    try {
      await pgPool.query(query);
      await transaction.commit();
    } catch (e: any) {
      await transaction.rollback();
      throwError = e;
    }

    expect(pgPoolClient.query).toHaveBeenCalledWith('BEGIN', []);
    expect(pgPoolClient.query).toHaveBeenCalledWith('ROLLBACK', []);
    expect(pgPoolClient.query).toHaveBeenCalledWith(query, []);

    expect(pgPoolClient.release).toHaveBeenCalledTimes(1);
    expect(pgPoolClient.query).toHaveBeenCalledTimes(3);

    expect(throwError).toBeDefined();
    expect(pgPool.client).toBeNull();

    expect(throwError?.message).toBe(INTERNAL_SERVER_ERROR_MESSAGE);
    expect(throwError?.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
    expect(throwError?.originalError).toStrictEqual({
      name: expectedError.name,
      message: expectedError.message,
      stack: expectedError.stack,
    });
  });

  it('should throw a conflict error and the error status should be 419', async () => {
    const expectedError = new Error() as DatabaseError;
    expectedError.code = '23505';

    const spyLog = vi.spyOn(pgPool.logger, 'log');
    pgPool.pool.query.mockRejectedValueOnce(expectedError);
    let throwError: AppError | undefined;

    try {
      await pgPool.query('SELECT 1 + 1;');
    } catch (error: any) {
      throwError = error;
    }

    expect(throwError).toBeDefined();
    expect(throwError?.statusCode).toBe(HttpStatusCode.CONFLICT);
    expect(throwError?.code).toBe(expectedError.code);
    expect(throwError?.originalError).toStrictEqual({
      name: expectedError.name,
      message: expectedError.message,
      stack: expectedError.stack,
      code: expectedError.code,
    });

    expect(spyLog).toHaveBeenCalledTimes(1);
    expect(spyLog).toHaveBeenCalledWith(
      LogLevel.ERROR,
      'postgres query',
      expect.objectContaining({
        name: pgOptions.appName,
        type: 'POOL',
        duration: expect.any(String),
        query: 'SELECT 1 + 1;',
        values: [],
      }),
    );
  });

  it(`should test if the query's "rowCount" field returns "undefined" and the "length" of the "rows" is assigned`, async () => {
    const mockRows = [
      { id: 1, name: 'name 1' },
      { id: 2, name: 'name 2' },
    ];

    const spyLog = vi.spyOn(pgPool.logger, 'log');
    pgPool.pool.query.mockResolvedValueOnce({
      ...mockQueryResult,
      rowCount: undefined,
      rows: mockRows,
    } as any);

    const values = [[1, 2]];
    const query = 'SELECT id, name FROM tb WHERE id = ANY($1)';
    const result = await pgPool.query<{ id: string; name: string }>(
      query,
      values,
    );

    expect(pgPool.pool.query).toHaveBeenCalledTimes(1);
    expect(pgPool.pool.query).toHaveBeenCalledWith(query, values);

    expect(result.rowCount).toBe(2);
    expect(result.rows).toEqual(mockRows);

    expect(spyLog).toHaveBeenCalledTimes(1);
    expect(spyLog).toHaveBeenCalledWith(
      LogLevel.INFO,
      'postgres query',
      expect.objectContaining({
        name: pgOptions.appName,
        type: 'POOL',
        duration: expect.any(String),
        values,
        query,
      }),
    );
  });

  it('should call the "release" method without having the "client" configured', () => {
    const spyLog = vi.spyOn(pgPool.logger, 'log');
    pgPool.release();
    expect(spyLog).not.toBeCalled();
  });

  it('should create a "pgPool" with the "fromEnvironment" method', () => {
    vi.clearAllMocks();
    vi.stubEnv('DB_APP_NAME', 'app_with_env');
    vi.stubEnv('DB_NAME', 'db_with_env');
    vi.stubEnv('DB_HOST', pgOptions.host);
    vi.stubEnv('DB_PASSWORD', pgOptions.password);
    vi.stubEnv('DB_USERNAME', pgOptions.username);
    const newPgPool = PgPool.fromEnvironment(new Logger('ID'));
    expect(newPgPool).toBeInstanceOf(PgPool);
    expect(Pool).toHaveBeenCalledWith({
      ...expectPoolConstructor,
      application_name: 'app_with_env',
      connectionTimeoutMillis: 2000,
      database: 'db_with_env',
      query_timeout: 3000,
      max: 35,
    });
    vi.unstubAllEnvs();
  });

  it('should call the "query" method with "logging=false"', async () => {
    vi.clearAllMocks();
    const spyLog = vi.spyOn(pgPool.logger, 'log');
    pgPool = newPgPoolWithOptions({ ...pgOptions, logging: false });
    await pgPool.query('SELECT 1 + 1;');
    expect(spyLog).not.toBeCalled();
  });

  it('should execute a query with multiple statements and return an array with the correct data', async () => {
    pgPool.pool.query.mockResolvedValue([
      { ...mockQueryResult, command: 'SHOW' },
      { ...mockQueryResult, command: 'SHOW' },
    ] as any);

    const results = await pgPool.query({
      query: 'SHOW max_connections; SHOW superuser_reserved_connections;',
      multiple: true,
    });

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      ...mockQueryResult,
      duration: expect.any(String),
      query: 'SHOW max_connections',
      command: 'SHOW',
    });

    expect(results[1]).toMatchObject({
      ...mockQueryResult,
      duration: expect.any(String),
      query: 'SHOW superuser_reserved_connections',
      command: 'SHOW',
    });
  });

  it('should execute the query and log with an id different from the default', async () => {
    vi.stubEnv('NODE_ENV', 'local');
    vi.useFakeTimers({ now: new Date(0) });

    vi.spyOn(DurationTime.prototype, 'format').mockReturnValueOnce('0ms');

    const spyStdoutWrite = vi.spyOn(process.stdout, 'write');
    spyStdoutWrite.mockImplementationOnce(() => true);

    await pgPool.query({ query: 'SELECT 1 + 1;', logId: 'any_id' });

    expect(spyStdoutWrite).toHaveBeenCalledTimes(1);
    expect(spyStdoutWrite).toHaveBeenCalledWith(
      `${JSON.stringify({
        id: 'any_id',
        level: LogLevel.INFO,
        pid: process.pid,
        hostname: os.hostname(),
        timestamp: '1970-01-01T00:00:00.000Z',
        message: 'postgres query',
        metadata: {
          name: 'test',
          type: 'POOL',
          duration: '0ms',
          query: 'SELECT 1 + 1;',
          values: [],
        },
      })}\n`,
    );

    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('should execute the "createTransactionManaged" method with a function that returns a value of type "object" performing the "commit"', async () => {
    const mockUser = { id: 1, name: 'name 1' };
    const fn = vi.fn().mockResolvedValueOnce(mockUser);
    const result = await pgPool.createTransactionManaged(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(pgPool);
    expect(result).toStrictEqual(mockUser);
  });

  it('should execute the "createTransactionManaged" method with a function that throws an error and performing the "rollback"', async () => {
    const mockError = new Error('any_message');
    const fn = vi.fn().mockRejectedValueOnce(mockError);
    await expect(pgPool.createTransactionManaged(fn)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
