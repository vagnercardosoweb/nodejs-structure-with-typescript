import { Pool, PoolClient } from 'pg';
import { describe, vi } from 'vitest';

import { DurationTime } from '@/shared/duration-time';
import { AppError } from '@/shared/errors';
import { Logger, LoggerInterface, LogLevel } from '@/shared/logger';
import { PgPool, BaseRepository, PgPoolInterface } from '@/shared/postgres';
import { isValidUuid } from '@/shared/string';

interface PgPoolWithPublicProperty extends PgPoolInterface {
  closed: boolean;
  logger: LoggerInterface;
  hasCloned: boolean;
  log: (level: LogLevel, message: string, metadata?: any) => void;
  client: PoolClient;
  pool: Pool;
}

type Input = {
  name: string;
  created_at?: Date;
  updated_at?: Date;
  email: string;
};

type Output = Input & {
  id: string;
  updated_at: Date;
  deleted_at: Date | null;
  created_at: Date;
};

class TestRepository extends BaseRepository<Input, Output> {
  protected readonly tableName = 'test_table';
  protected readonly primaryKey: string | null = 'id';
}

const createTestTable = async (pgPool: PgPoolWithPublicProperty) => {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS test_table (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL DEFAULT NULL
    );
  `);
};

const dropTestTable = async (pgPool: PgPoolWithPublicProperty) => {
  await pgPool.query('DROP TABLE IF EXISTS test_table CASCADE;');
};

describe('shared/postgres/repository', () => {
  let pgPool: PgPoolWithPublicProperty;
  let testRepository: TestRepository;

  beforeEach(async () => {
    vi.spyOn(DurationTime.prototype, 'format').mockReturnValue('0ms');
    pgPool = (await PgPool.fromEnvironment(
      new Logger('PG'),
    ).connect()) as PgPoolWithPublicProperty;
    testRepository = new TestRepository(pgPool);
    await createTestTable(pgPool);
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await dropTestTable(pgPool);
    await pgPool.close();
  });

  it('should create a record and returns "id" and "created_at"', async () => {
    const spyPoolQuery = vi.spyOn(pgPool.pool, 'query');

    const data = { name: 'any name', email: 'any_email@test.com' };
    const record = await testRepository.create({
      data,
      returning: ['id', 'created_at'],
    });

    expect(spyPoolQuery).toHaveBeenCalledTimes(1);
    expect(spyPoolQuery).toHaveBeenCalledWith(
      'INSERT INTO test_table (name, email, created_at) VALUES ($1, $2, $3) RETURNING id, created_at;',
      Object.values({ ...data, created_at: 'NOW()' }),
    );

    expect(Object.keys(record)).toHaveLength(2);
    expect(record).toHaveProperty('id');
    expect(isValidUuid(record.id as string)).toBe(true);
    expect(record).toHaveProperty('created_at');
    expect(record.created_at).toBeInstanceOf(Date);
  });

  it('should create a record and not return any results', async () => {
    vi.useFakeTimers({ now: new Date(0) });

    const spyPoolQuery = vi.spyOn(pgPool.pool, 'query');
    const data = {
      name: 'any name',
      created_at: new Date(),
      email: 'any_email@test.com',
    };

    const record = await testRepository.create({ data });
    expect(record).toBeUndefined();

    expect(spyPoolQuery).toHaveBeenCalledTimes(1);
    expect(spyPoolQuery).toHaveBeenCalledWith(
      'INSERT INTO test_table (name, created_at, email) VALUES ($1, $2, $3);',
      Object.values({ ...data, created_at: '1970-01-01T00:00:00.000Z' }),
    );

    const result = await testRepository.findOne({
      where: ['email = $1'],
      values: [data.email],
      orderBy: ['created_at DESC'],
    });

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('id');
    expect(isValidUuid(result?.id as string)).toBe(true);
    expect(result).toHaveProperty('created_at');
    expect(result?.created_at).toEqual(data.created_at);
    expect(result).toHaveProperty('name');
    expect(result?.name).toBe(data.name);
    expect(result).toHaveProperty('email');
    expect(result?.email).toBe(data.email);

    vi.useRealTimers();
  });

  it('should create a record and retrieve the id successfully', async () => {
    const data = { name: 'any name', email: 'any_email@test.com' };

    const record = await testRepository.create({
      returning: ['id'],
      data,
    });

    expect(record).toHaveProperty('id');

    const result = await testRepository.findById({
      id: record.id,
      rejectOnEmpty: 'Record not found',
    });

    expect(result.id).toBe(record.id);
    expect(result.name).toBe(data.name);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.email).toBe(data.email);
  });

  it('should return an error when executing the "findById" method without a "primaryKey" configured', async () => {
    class TestRepositoryWithoutPrimaryKey extends TestRepository {
      protected readonly primaryKey = null;
    }

    testRepository = new TestRepositoryWithoutPrimaryKey(pgPool);
    let expectedError: AppError | undefined;

    try {
      await testRepository.findById({
        id: 'any_id',
        rejectOnEmpty: 'any_error',
      });

      throw new Error('This line should not be executed');
    } catch (e: any) {
      expectedError = e;
    }

    expect(expectedError?.message).toEqual(
      'The primary key for model "TestRepositoryWithoutPrimaryKey" is not set.',
    );
  });

  it('should execute the "findById" method with the incorrect "values"', async () => {
    let expectedError: AppError | undefined;

    try {
      await testRepository.findById({
        id: 'any_id',
        rejectOnEmpty: 'any_error',
        where: ['email = $1'],
      });

      throw new Error('This line should not be executed');
    } catch (e: any) {
      expectedError = e;
    }

    expect(expectedError?.message).toEqual(
      'The query bind is incorrect, needs to have "1" values and received "0".',
    );

    expect(expectedError?.metadata).toEqual({
      id: 'any_id',
      rejectOnEmpty: undefined,
      where: ['email = $1'],
      values: [],
    });
  });

  it('should execute the "findOne" method and return the result', async () => {
    const data = { name: 'any name', email: 'any_email@test.com' };

    const record = await testRepository.create({
      returning: ['id'],
      data,
    });

    const result = await testRepository.findOne({
      where: ['id = $1'],
      values: [record.id],
    });

    expect(result).not.toBeNull();
    expect(result?.id).toBe(record.id);
    expect(result?.name).toBe(data.name);
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.email).toBe(data.email);
  });

  it('should execute the "findOne" method and return "null"', async () => {
    const result = await testRepository.findOne({
      where: ['email = $1'],
      values: ['any_email@test.com'],
    });

    expect(result).toBeNull();
  });

  it('should execute the "findOne" method and return "null" and throw a not found error', async () => {
    expect(
      testRepository.findOne({
        where: ['email = $1'],
        rejectOnEmpty: new Error('Custom error message'),
        values: ['any_email@test.com'],
      }),
    ).rejects.toThrowError('Custom error message');

    expect(
      testRepository.findOne({
        where: ['email = $1'],
        rejectOnEmpty: 'Email not found',
        values: ['any_email@test.com'],
      }),
    ).rejects.toThrowError('Email not found');
  });

  it('should execute the "findAll" method and check if it returned all results', async () => {
    const spyPoolQuery = vi.spyOn(pgPool.pool, 'query');
    const limit = 50;

    for (let i = 0; i < limit; i++) {
      const index = i + 1;
      await testRepository.create({
        data: { name: `Name ${index}`, email: `email${index}@test.com` },
      });
    }

    expect(spyPoolQuery).toHaveBeenCalledTimes(limit);
    const results = await testRepository.findAll();
    expect(results).toHaveLength(limit);

    expect(results[0]).toHaveProperty('id');
    expect(isValidUuid(results[0].id as string)).toBe(true);
    expect(results[0].email).toBe('email1@test.com');
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].name).toBe('Name 1');
  });

  it('should execute the "findAll" method with all properties and check the returns', async () => {
    const spyPoolQuery = vi.spyOn(pgPool.pool, 'query');
    let limit = 5;

    for (let i = 0; i < limit; i++) {
      const index = i + 1;
      await testRepository.create({
        data: { name: `Name ${index}`, email: `email${index}@test.com` },
      });
    }

    expect(spyPoolQuery).toHaveBeenCalledTimes(limit);
    let results = await testRepository.findAll<{
      id: string;
      email: string;
    }>({
      tableAlias: 't',
      columns: ['id', 't.name', 'test_table.email AS email'],
      joins: ['LEFT JOIN test_table ON t.id = test_table.id'],
      groupBy: ['t.id', 'test_table.email'],
      orderBy: ['t.created_at DESC'],
      offset: 0,
      where: ['t.email = $1'],
      values: ['email3@test.com'],
      limit: 1,
    });

    expect(spyPoolQuery).toHaveBeenCalledTimes(++limit);
    expect(spyPoolQuery).toHaveBeenCalledWith(
      'SELECT t.id, t.name, test_table.email AS email FROM test_table AS t LEFT JOIN test_table ON t.id = test_table.id WHERE t.email = $1 GROUP BY t.id, test_table.email ORDER BY t.created_at DESC LIMIT 1 OFFSET 0',
      ['email3@test.com'],
    );

    expect(results).toHaveLength(1);
    expect(results[0].email).toBe('email3@test.com');

    results = await testRepository.findAll({
      columns: ['id', 'email'],
      orderBy: ['created_at DESC'],
      where: ['email = $1'],
      values: ['email1@test.com'],
      limit: 1,
    });

    expect(spyPoolQuery).toHaveBeenCalledTimes(++limit);
    expect(spyPoolQuery).toHaveBeenCalledWith(
      'SELECT id, email FROM test_table WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
      ['email1@test.com'],
    );

    expect(results).toHaveLength(1);
    expect(results[0].email).toBe('email1@test.com');
  });

  it('should execute the "findAll" method with filter and validate the return without data', async () => {
    const results = await testRepository.findAll({
      values: ['email3@test.com'],
      where: ['email = $1'],
    });

    expect(results).toBeInstanceOf(Array);
    expect(results).toHaveLength(0);
  });

  it('should throw an error when trying to execute "findAll" with "*" in "columns"', async () => {
    let expectedError: AppError | undefined;

    try {
      await testRepository.findAll({ columns: ['*'] });
      throw new Error('This line should not be executed');
    } catch (e: any) {
      expectedError = e;
    }

    expect(expectedError?.message).toEqual('The column "*" is not allowed');
    expect(expectedError?.metadata?.repositoryName).toEqual(
      testRepository.constructor.name,
    );
  });

  it('should execute the "findAndCountAll" method and return all results', async () => {
    const spyPoolQuery = vi.spyOn(pgPool.pool, 'query');
    const limit = 5;

    for (let i = 0; i < limit; i++) {
      const index = i + 1;
      await testRepository.create({
        data: { name: `Name ${index}`, email: `email${index}@test.com` },
      });
    }

    expect(spyPoolQuery).toHaveBeenCalledTimes(limit);

    const { rows, total } = await testRepository.findAndCountAll({
      where: ['1 = $1::INTEGER'],
      tableAlias: 't',
      values: [1],
    });

    expect(spyPoolQuery).toHaveBeenCalledTimes(limit + 2);
    expect(rows).toHaveLength(limit);
    expect(total).toBe(limit);
  });

  it('should remove a record completely without "soft delete"', async () => {
    const spyPoolQuery = vi.spyOn(pgPool.pool, 'query');

    class TestRepositoryWithoutSoftDelete extends TestRepository {
      protected readonly deletedAt = null;
    }

    testRepository = new TestRepositoryWithoutSoftDelete(pgPool);

    const data = { name: 'any name', email: 'any_email@test.com' };
    const created = await testRepository.create({ data, returning: ['id'] });

    const deleted = await testRepository.delete({
      where: ['email = $1'],
      returning: ['id'],
      values: [data.email],
    });

    expect(spyPoolQuery).toHaveBeenCalledWith(
      'DELETE FROM test_table WHERE email = $1 RETURNING id',
      [data.email],
    );

    expect(deleted.id).toBe(created.id);
  });

  it('should remove a record completely with "soft delete"', async () => {
    const spyPoolQuery = vi.spyOn(pgPool.pool, 'query');

    const data = { name: 'any name', email: 'any_email@test.com' };
    const created = await testRepository.create({ data, returning: ['id'] });

    const deleted = await testRepository.delete({
      where: ['email = $1'],
      returning: ['id'],
      values: [data.email],
    });

    expect(spyPoolQuery).toHaveBeenCalledWith(
      'UPDATE test_table SET deleted_at = $1, updated_at = $2 WHERE email = $3 RETURNING id',
      ['NOW()', 'NOW()', data.email],
    );

    expect(deleted.id).toBe(created.id);
  });

  it('should update a record successfully without passing the explicit "updated_at"', async () => {
    const spyPoolQuery = vi.spyOn(pgPool.pool, 'query');

    const data = { name: 'any name', email: 'any_email@test.com' };
    const created = await testRepository.create({
      data,
      returning: ['id', 'updated_at'],
    });

    const updated = await testRepository.update({
      data: { name: 'new name', email: 'new_email@test.com' },
      where: ['email = $1'],
      returning: ['id', 'email', 'name', 'updated_at'],
      values: [data.email],
    });

    expect(spyPoolQuery).toHaveBeenCalledWith(
      'UPDATE test_table SET name = $1, email = $2, updated_at = $3 WHERE email = $4 RETURNING id, email, name, updated_at',
      ['new name', 'new_email@test.com', 'NOW()', data.email],
    );

    expect(updated.id).toBe(created.id);
    expect(updated.name).toBe('new name');
    expect(updated.email).toBe('new_email@test.com');
    expect(updated.updated_at).not.toEqual(created.updated_at);
  });

  it('should update a record successfully with passing the explicit "updated_at"', async () => {
    const spyPoolQuery = vi.spyOn(pgPool.pool, 'query');

    const data = { name: 'any name', email: 'any_email@test.com' };
    const created = await testRepository.create({
      data,
      returning: ['id', 'updated_at'],
    });

    const updatedAt = new Date('2023-01-01T00:00:00.000Z');
    const updated = await testRepository.update({
      where: ['id = $1'],
      returning: ['id'],
      values: [created.id],
      data: {
        name: 'new name',
        updated_at: updatedAt,
      },
    });

    expect(created.id).toBe(updated.id);
    expect(spyPoolQuery).toHaveBeenCalledWith(
      'UPDATE test_table SET name = $1, updated_at = $2 WHERE id = $3 RETURNING id',
      ['new name', '2023-01-01T00:00:00.000Z', created.id],
    );
  });

  it('should try to perform an "update without passing the "where"', async () => {
    let expectedError: AppError | undefined;

    try {
      await testRepository.update({
        where: [],
        values: [],
        data: { name: 'any name' },
      });

      throw new Error('This line should not be executed');
    } catch (e: any) {
      expectedError = e;
    }

    expect(expectedError?.message).toEqual(
      'The where clause is empty for model "TestRepository".',
    );
  });

  it('should try to perform an "delete without passing the "where"', async () => {
    let expectedError: AppError | undefined;

    try {
      await testRepository.delete({ values: [], where: [] });
      throw new Error('This line should not be executed');
    } catch (e: any) {
      expectedError = e;
    }

    expect(expectedError?.message).toEqual(
      'The where clause is empty for model "TestRepository".',
    );
  });
});
