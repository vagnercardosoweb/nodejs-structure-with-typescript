import fs from 'node:fs';
import path from 'node:path';

import { PgPoolInterface } from '@/shared/postgres';

enum Prefix {
  DOWN = 'down',
  UP = 'up',
}

export class Migrator {
  protected prefix = Prefix.UP;

  constructor(
    protected readonly pgPool: PgPoolInterface,
    protected readonly path: string,
  ) {}

  public async down(limit = 1): Promise<void> {
    this.prefix = Prefix.DOWN;
    await this.checkOrCreateMigrationTable();
    let query = 'SELECT file_name FROM migrations ORDER BY file_name DESC';
    if (limit !== -1) query += ` LIMIT ${limit}`;
    const { rows } = await this.pgPool.query<{ file_name: string }>(query);
    if (rows.length === 0) return;
    await this.pgPool.createTransactionManaged(async () => {
      for await (const row of rows) {
        await this.executeSql(row.file_name);
      }
    });
  }

  public async up(): Promise<void> {
    this.prefix = Prefix.UP;
    const files = await this.getMigrationsFilesToUp();
    if (files.length === 0) return;
    await this.checkOrCreateMigrationTable();
    const migrations = await this.getMigrationFromDb();
    await this.pgPool.createTransactionManaged(async () => {
      for await (const file of files) {
        if (migrations?.[file]) continue;
        await this.executeSql(file);
      }
    });
  }

  protected async getMigrationsFilesToUp(): Promise<string[]> {
    const files = await fs.promises.readdir(this.path);
    return files
      .filter((path) => path.endsWith(`${this.prefix}.sql`))
      .map((path) => path.replace(/\.(up|down)\.sql/gm, ''))
      .sort((a: string, b: string) => a.localeCompare(b));
  }

  protected async checkOrCreateMigrationTable() {
    const schema = (this.pgPool as any).options.schema;
    if (schema !== 'public') {
      await this.pgPool.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
    }
    const result = await this.pgPool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = $1
         AND table_name = $2;`,
      [schema, 'migrations'],
    );
    if (result.rows.length === 0) {
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          file_name VARCHAR NOT NULL,
          created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC') NOT NULL
        );
        CREATE INDEX IF NOT EXISTS migrations_file_name_idx ON migrations (file_name);
        ALTER TABLE migrations
          DROP CONSTRAINT IF EXISTS migrations_file_name_uk,
          ADD CONSTRAINT migrations_file_name_uk UNIQUE (file_name);
        ALTER TABLE migrations
          DROP CONSTRAINT IF EXISTS migrations_file_name_pk,
          ADD CONSTRAINT migrations_file_name_pk PRIMARY KEY (file_name);
      `);
    }
  }

  protected async executeSql(fileName: string) {
    await this.pgPool.query(await this.getContentSql(fileName));
    await this.pgPool.query(
      this.prefix === Prefix.UP
        ? 'INSERT INTO migrations (file_name, created_at) VALUES ($1, NOW());'
        : 'DELETE FROM migrations WHERE file_name = $1;',
      [fileName],
    );
  }

  protected async getContentSql(fileName: string) {
    fileName = `${fileName}.${this.prefix}.sql`;
    const filePath = path.resolve(this.path, fileName);
    const content = await fs.promises.readFile(filePath);
    return content.toString();
  }

  protected async getMigrationFromDb(): Promise<Record<string, boolean>> {
    const query = 'SELECT file_name FROM migrations;';
    const { rows } = await this.pgPool.query<{ file_name: string }>(query);
    return rows.reduce(
      (previous, current) => {
        previous[current.file_name] = true;
        return previous;
      },
      {} as Record<string, boolean>,
    );
  }
}
