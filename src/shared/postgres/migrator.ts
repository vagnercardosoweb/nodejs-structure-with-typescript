import fs from 'node:fs';
import path from 'node:path';

import { LoggerInterface } from '@/shared';

import { PgPoolInterface } from './types';

enum Prefix {
  UP = 'up',
  DOWN = 'down',
}

export class Migrator {
  protected logger: LoggerInterface;
  protected readonly tableName = 'migrations';
  protected prefix: Prefix = Prefix.UP;

  constructor(
    protected readonly db: PgPoolInterface,
    protected readonly path: string,
  ) {}

  public async up(): Promise<void> {
    this.prefix = Prefix.UP;

    await this.db.createTransactionManaged(async (pool) => {
      await this.checkAndCreateTableMigrations(pool as any);
      await this.runMigrations(pool as any);
    });
  }

  public async down(): Promise<void> {
    this.prefix = Prefix.DOWN;

    await this.db.createTransactionManaged(async (connection) => {
      await this.checkAndCreateTableMigrations(connection as any);
      await this.runMigrations(connection as any);
    });
  }

  protected async runMigrations(pool: PgPoolInterface): Promise<void> {
    const fileNames = await this.getFileNames();
    const migrationsFromDb = await this.getMigrations(pool);
    for await (const fileName of fileNames) {
      if (migrationsFromDb?.[fileName]) continue;
      await this.executeSql(pool, fileName);
    }
  }

  protected async getFileNames(): Promise<string[]> {
    const files = await fs.promises.readdir(this.path);
    return files
      .filter((path) => path.endsWith(`${this.prefix}.sql`))
      .sort((a: string, b: string) => a.localeCompare(b));
  }

  private async checkAndCreateTableMigrations(pool: PgPoolInterface) {
    const result = await pool.query(
      `SELECT
         table_name
       FROM information_schema.tables
       WHERE table_name = '${this.tableName}';
      `,
    );
    if (result.rows.length === 0) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          name VARCHAR NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS ${this.tableName}_name_index ON ${this.tableName} (name);
        CREATE UNIQUE INDEX IF NOT EXISTS ${this.tableName}_name_uidx ON ${this.tableName} (name);
        ALTER TABLE ${this.tableName}
          DROP CONSTRAINT IF EXISTS ${this.tableName}_name_pk,
          ADD CONSTRAINT ${this.tableName}_name_pk PRIMARY KEY (name);
      `);
    }
  }

  private async executeSql(pool: PgPoolInterface, fileName: string) {
    const sql = await fs.promises.readFile(path.resolve(this.path, fileName));
    await pool.query(sql.toString());
    await pool.query(
      this.prefix === Prefix.UP
        ? `INSERT INTO ${this.tableName} (name, created_at)
           VALUES ('${fileName}', NOW());`
        : `DELETE
           FROM ${this.tableName}
           WHERE name = '${fileName}';`,
    );
  }

  private async getMigrations(pool: PgPoolInterface) {
    const queryResult = await pool.query(`
      SELECT
        name
      FROM ${this.tableName}
      ORDER BY name ASC;
    `);
    return queryResult.rows.reduce((previous, current) => {
      previous[current.name] = true;
      return previous;
    }, {} as Record<string, true>);
  }
}
