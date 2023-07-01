import { InternalServerError } from '@/shared';

import { PgPoolInterface } from './types';

export class Transaction {
  protected started = false;
  protected handlers: Handlers[] = [];

  public constructor(protected readonly client: PgPoolInterface) {}

  public async begin() {
    if (this.started) return;
    await this.client.query('BEGIN');
    this.started = true;
  }

  public async commit() {
    await this.runCommitOrRollback('COMMIT');
  }

  public async rollback() {
    await this.runCommitOrRollback('ROLLBACK');
  }

  public onCommit(handle: Handle): void {
    this.handlers.push({ kind: 'COMMIT', handle });
  }

  public onRollback(handle: Handle): void {
    this.handlers.push({ kind: 'ROLLBACK', handle });
  }

  public onFinish(handle: Handle) {
    this.handlers.push({ kind: 'FINISH', handle });
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
      await this.client.query(query);
    } finally {
      const kind = query as Kind;
      await Promise.all(
        this.handlers
          .filter((handler) => [kind, 'FINISH'].includes(handler.kind))
          .map((handler) => handler.handle()),
      ).catch(() => {});
    }
  }
}

type Kind = 'COMMIT' | 'ROLLBACK' | 'FINISH';

export type Handle = () => Promise<void> | void;
type Handlers = {
  handle: Handle;
  kind: Kind;
};

export interface TransactionInterface {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  onCommit(handle: Handle): void;
  onRollback(handle: Handle): void;
  onFinish(handle: Handle): void;
}
