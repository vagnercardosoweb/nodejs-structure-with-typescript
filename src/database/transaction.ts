import type { Database } from './index';

export class Transaction {
  public constructor(protected readonly database: Database) {}

  public async start() {
    await this.database.query('START TRANSACTION;');
  }

  public async commit() {
    await this.database.query('COMMIT TRANSACTION;');
  }

  public async rollback() {
    await this.database.query('ROLLBACK TRANSACTION;');
  }
}
