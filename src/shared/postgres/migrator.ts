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

    await this.db.createTransactionManaged(async () => {
      await this.checkAndCreateTableMigrations();
      await this.runMigrations();
    });
  }

  public async down(): Promise<void> {
    this.prefix = Prefix.DOWN;

    await this.db.createTransactionManaged(async () => {
      await this.checkAndCreateTableMigrations();
      await this.runMigrations();
    });
  }

  protected async runMigrations(): Promise<void> {
    const fileNames = await this.getFileNames();
    const migrationsFromDb = await this.getMigrations();
    for await (const fileName of fileNames) {
      if (migrationsFromDb?.[fileName]) continue;
      await this.executeSql(fileName);
    }
  }

  protected async getFileNames(): Promise<string[]> {
    const files = await fs.promises.readdir(this.path);
    return files
      .filter((path) => path.endsWith(`${this.prefix}.sql`))
      .sort((a: string, b: string) => a.localeCompare(b));
  }

  private async checkAndCreateTableMigrations() {
    const result = await this.db.query(
      `SELECT
         table_name
       FROM information_schema.tables
       WHERE table_name = '${this.tableName}';
      `,
    );
    if (result.rows.length === 0) {
      await this.db.query(`
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

  private async executeSql(fileName: string) {
    const sql = await fs.promises.readFile(path.resolve(this.path, fileName));
    await this.db.query(sql.toString());
    await this.db.query(
      this.prefix === Prefix.UP
        ? `INSERT INTO ${this.tableName} (name, created_at)
           VALUES ('${fileName}', NOW());`
        : `DELETE
           FROM ${this.tableName}
           WHERE name = '${fileName}';`,
    );
  }

  private async getMigrations() {
    const queryResult = await this.db.query(`
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
