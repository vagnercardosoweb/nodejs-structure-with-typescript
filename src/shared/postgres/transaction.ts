import { InternalServerError } from '@/shared';

import { PgPoolInterface } from './types';

export class Transaction {
  protected started = false;
  protected handlers: Handlers[] = [];

  public constructor(protected readonly client: PgPoolInterface) {}

  public async begin() {
    if (this.started) return;
    await this.client.query('BEGIN', []);
    this.started = true;
  }

  public async commit() {
    await this.runCommitOrRollback('COMMIT');
  }

  public async rollback() {
    await this.runCommitOrRollback('ROLLBACK');
  }

  public onCommit(handle: Handle): void {
    this.handlers.push({ operator: 'commit', handle });
  }

  public onRollback(handle: Handle): void {
    this.handlers.push({ operator: 'rollback', handle });
  }

  public onFinish(handle: Handle) {
    this.handlers.push({ operator: 'finish', handle });
  }

  private async runCommitOrRollback(query: string) {
    if (!this.started) {
      throw new InternalServerError({
        code: 'DATABASE:TRANSACTION:NO_STARTED',
        message:
          'The transaction has not started yet, use the [begin] method to start.',
      });
    }

    try {
      await this.client.query(query, []);
    } finally {
      const operator = query.toLowerCase() as Operator;
      await Promise.all(
        this.handlers
          .filter((handler) => [operator, 'finish'].includes(handler.operator))
          .map((handler) => handler.handle()),
      );
    }
  }
}

export type Handle = () => void;

export interface TransactionInterface {
  begin(): Promise<void>;

  commit(): Promise<void>;

  rollback(): Promise<void>;

  onCommit(handle: Handle): void;

  onRollback(handle: Handle): void;

  onFinish(handle: Handle): void;
}

type Operator = 'commit' | 'rollback' | 'finish';

type Handlers = {
  operator: Operator;
  handle: Handle;
};
