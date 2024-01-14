import { Pool, PoolClient } from 'pg';
import { describe, vi } from 'vitest';

import { DurationTime } from '@/shared/duration-time';
import { Logger, LoggerInterface, LogLevel } from '@/shared/logger';
import { PgPool } from '@/shared/postgres/pool';
import { PgPoolInterface } from '@/shared/postgres/types';

interface PgPoolWithPublicProperty extends PgPoolInterface {
  closed: boolean;
  logger: LoggerInterface;
  hasCloned: boolean;
  logQuery: (level: LogLevel, metadata: any) => void;
  client: PoolClient;
  pool: Pool;
}

describe('shared/postgres/pool', () => {
  let pgPool: PgPoolWithPublicProperty;

  beforeEach(async () => {
    vi.spyOn(DurationTime.prototype, 'format').mockReturnValue('0ms');
    pgPool = (await PgPool.fromEnvironment(
      new Logger('PG'),
    ).connect()) as PgPoolWithPublicProperty;
  });

  afterEach(async () => {
    vi.spyOn(DurationTime.prototype, 'format').mockRestore();
    await pgPool.close();
  });

  it('should connect to the database and return the correct query result', async () => {
    const spyPoolQuery = vi.spyOn(pgPool.pool, 'query');
    const result = await pgPool.query('SELECT 1 + 1;');

    expect(spyPoolQuery).toHaveBeenCalledTimes(1);
    expect(spyPoolQuery).toHaveBeenCalledWith('SELECT 1 + 1;', []);

    expect(result).toMatchInlineSnapshot(`
      {
        "command": "SELECT",
        "duration": "0ms",
        "fields": [
          Field {
            "columnID": 0,
            "dataTypeID": 23,
            "dataTypeModifier": -1,
            "dataTypeSize": 4,
            "format": "text",
            "name": "?column?",
            "tableID": 0,
          },
        ],
        "oid": null,
        "query": "SELECT 1 + 1;",
        "rowCount": 1,
        "rows": [
          {
            "?column?": 2,
          },
        ],
        "values": [],
      }
    `);
  });

  it('should perform a query with multiple results', async () => {
    const results = await pgPool.query({
      query: 'SELECT 1 + 1; SELECT 2 + 2;',
      multiple: true,
    });

    expect(results).toMatchInlineSnapshot(`
      [
        {
          "command": "SELECT",
          "duration": "0ms",
          "fields": [
            Field {
              "columnID": 0,
              "dataTypeID": 23,
              "dataTypeModifier": -1,
              "dataTypeSize": 4,
              "format": "text",
              "name": "?column?",
              "tableID": 0,
            },
          ],
          "oid": null,
          "query": "SELECT 1 + 1",
          "rowCount": 1,
          "rows": [
            {
              "?column?": 2,
            },
          ],
          "values": [],
        },
        {
          "command": "SELECT",
          "duration": "0ms",
          "fields": [
            Field {
              "columnID": 0,
              "dataTypeID": 23,
              "dataTypeModifier": -1,
              "dataTypeSize": 4,
              "format": "text",
              "name": "?column?",
              "tableID": 0,
            },
          ],
          "oid": null,
          "query": "SELECT 2 + 2",
          "rowCount": 1,
          "rows": [
            {
              "?column?": 4,
            },
          ],
          "values": [],
        },
      ]
    `);
  });

  it('should execute a query passing all input parameters by arguments', async () => {
    const result = await pgPool.query(
      'SELECT $1::INTEGER + $2::INTEGER;',
      [1, 1],
    );

    expect(result).toMatchInlineSnapshot(`
      {
        "command": "SELECT",
        "duration": "0ms",
        "fields": [
          Field {
            "columnID": 0,
            "dataTypeID": 23,
            "dataTypeModifier": -1,
            "dataTypeSize": 4,
            "format": "text",
            "name": "?column?",
            "tableID": 0,
          },
        ],
        "oid": null,
        "query": "SELECT $1::INTEGER + $2::INTEGER;",
        "rowCount": 1,
        "rows": [
          {
            "?column?": 2,
          },
        ],
        "values": [
          1,
          1,
        ],
      }
    `);
  });

  it('should execute a query passing the "logId=any_log"', async () => {
    const spyQueryLog = vi.spyOn(pgPool, 'logQuery');
    spyQueryLog.mockReset();

    const result = await pgPool.query({
      query: 'SELECT $1::INTEGER + $2::INTEGER;',
      logId: 'any_log',
      values: [1, 5],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "command": "SELECT",
        "duration": "0ms",
        "fields": [
          Field {
            "columnID": 0,
            "dataTypeID": 23,
            "dataTypeModifier": -1,
            "dataTypeSize": 4,
            "format": "text",
            "name": "?column?",
            "tableID": 0,
          },
        ],
        "oid": null,
        "query": "SELECT $1::INTEGER + $2::INTEGER;",
        "rowCount": 1,
        "rows": [
          {
            "?column?": 6,
          },
        ],
        "values": [
          1,
          5,
        ],
      }
    `);

    expect(spyQueryLog).toHaveBeenCalledTimes(1);
    expect(spyQueryLog).toHaveBeenCalledWith(LogLevel.INFO, {
      name: 'test',
      type: 'POOL',
      duration: '0ms',
      logging: false,
      logId: 'any_log',
      query: 'SELECT $1::INTEGER + $2::INTEGER;',
      values: [1, 5],
    });
  });

  it.each([[true], [false]])(
    'should execute a query passing the "logging=%s"',
    async (logging) => {
      const spyQueryLog = vi.spyOn(pgPool, 'logQuery');
      spyQueryLog.mockReset();

      const result = await pgPool.query({
        logging,
        query: 'SELECT 1 + 1;',
      });

      expect(result).toEqual({
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
      });

      expect(spyQueryLog).toHaveBeenCalledTimes(1);
      expect(spyQueryLog).toHaveBeenCalledWith(LogLevel.INFO, {
        name: 'test',
        type: 'POOL',
        duration: '0ms',
        logging,
        $logId: undefined,
        query: 'SELECT 1 + 1;',
        values: [],
      });
    },
  );
});
