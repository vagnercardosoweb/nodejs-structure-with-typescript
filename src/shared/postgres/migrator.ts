import fs from 'node:fs';
import path from 'node:path';

import { LoggerInterface } from '@/shared';

import { DbConnectionInterface } from './types';

enum Prefix {
  UP = 'up',
  DOWN = 'down',
}

export class Migrator {
  protected prefix: Prefix = Prefix.UP;
  protected logger: LoggerInterface;

  constructor(
    protected readonly db: DbConnectionInterface,
    protected readonly path: string,
  ) {}

  public async up(): Promise<void> {
    this.prefix = Prefix.UP;

    await this.db.createTransactionManaged(async (connection) => {
      await this.checkAndCreateTableMigrations(connection as any);
      await this.runMigrations(connection as any);
    });
  }

  public async down(): Promise<void> {
    this.prefix = Prefix.DOWN;

    await this.db.createTransactionManaged(async (connection) => {
      await this.checkAndCreateTableMigrations(connection as any);
      await this.runMigrations(connection as any);
    });
  }

  protected async runMigrations(
    connection: DbConnectionInterface,
  ): Promise<void> {
    const fileNames = await this.getFileNames();
    const migrationsFromDb = await this.getMigrations(connection);
    for await (const fileName of fileNames) {
      if (migrationsFromDb?.[fileName]) continue;
      await this.executeSql(connection, fileName);
    }
  }

  protected async getFileNames(): Promise<string[]> {
    const files = await fs.promises.readdir(this.path);
    return files
      .filter((path) => path.endsWith(`${this.prefix}.sql`))
      .sort((a: string, b: string) => a.localeCompare(b));
  }

  private async checkAndCreateTableMigrations(
    connection: DbConnectionInterface,
  ) {
    const result = await connection.query(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_name = 'db_migrations';
      `,
    );
    if (result.rows.length === 0) {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS db_migrations
        (
          file_name  VARCHAR                   NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS db_migrations_name_index ON db_migrations (file_name);
        CREATE UNIQUE INDEX IF NOT EXISTS db_migrations_name_uidx ON db_migrations (file_name);
        ALTER TABLE db_migrations
          DROP CONSTRAINT IF EXISTS db_migrations_file_name_pk,
          ADD CONSTRAINT db_migrations_file_name_pk PRIMARY KEY (file_name);
      `);
    }
  }

  private async executeSql(
    connection: DbConnectionInterface,
    fileName: string,
  ) {
    const sql = await fs.promises.readFile(path.resolve(this.path, fileName));
    await connection.query(sql.toString());

    const afterQuery =
      this.prefix === Prefix.UP
        ? `
          INSERT INTO db_migrations (file_name, created_at)
          VALUES ('${fileName}', NOW());
        `
        : `
          DELETE
          FROM db_migrations
          WHERE file_name = '${fileName}';
        `;

    await connection.query(afterQuery);
  }

  private async getMigrations(connection: DbConnectionInterface) {
    const sqlMigrations = `
      SELECT file_name
      FROM db_migrations
      ORDER BY file_name ASC;
    `;
    const queryResult = await connection.query(sqlMigrations);
    return queryResult.rows.reduce((previous, current) => {
      previous[current.file_name] = true;
      return previous;
    }, {} as Record<string, true>);
  }
}
