import { DatabaseError, Pool, PoolClient, types } from 'pg';
import { describe, Mocked, vi } from 'vitest';

import { Logger, LoggerInterface, LogLevel } from '@/shared/logger';
import { PgPool, PgPoolInterface, PgPoolOptions } from '@/shared/postgres';

import { HttpStatusCode } from '../enums';
import { AppError, INTERNAL_SERVER_ERROR_MESSAGE } from '../errors';

const mockQueryResult = {
  oid: 0,
  command: 'SELECT',
  rowCount: 0,
  rows: [],
  fields: [],
  bind: [],
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

describe('shared/postgres/pool.ts', () => {
  let pgPool: PgPoolMockInterface;

  beforeEach(() => {
    pgPool = newPgPoolWithOptions(pgOptions);
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
        bind: [],
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

    const bind = [[1, 2]];
    const query = 'SELECT id, name FROM tb WHERE id = ANY($1)';
    const result = await pgPool.query(query, bind);

    expect(pgPool.pool.query).toHaveBeenCalledTimes(1);
    expect(pgPool.pool.query).toHaveBeenCalledWith(query, bind);

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
        query,
        bind,
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
    PgPool.fromEnvironment(new Logger('ID')) as PgPool;
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
    expect(pgPool.createTransactionManaged(fn)).rejects.toThrow();
  });
});
