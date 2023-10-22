import {
  HandleHook,
  InternalServerError,
  PgPoolInterface,
  TransactionInterface,
} from '@/shared';

export class Transaction implements TransactionInterface {
  protected started = false;
  protected finished = false;
  protected hooks: Hooks[] = [];

  public constructor(protected readonly client: PgPoolInterface) {}

  public async begin() {
    if (this.started) return;
    await this.client.query('BEGIN');
    this.started = true;
  }

  public async commit() {
    await this.runQuery('COMMIT');
    await this.runHooks(KindHook.COMMIT);
  }

  public async rollback() {
    await this.runQuery('ROLLBACK');
    await this.runHooks(KindHook.ROLLBACK);
  }

  public afterCommit(handle: HandleHook): void {
    this.hooks.push({ kind: KindHook.COMMIT, handle });
  }

  public afterRollback(handle: HandleHook): void {
    this.hooks.push({ kind: KindHook.ROLLBACK, handle });
  }

  protected async runHooks(kind: KindHook) {
    const handlers = this.hooks.filter((handler) => handler.kind === kind);
    for await (const handler of handlers) {
      const result = handler.handle.bind(this)(this.client);
      const isPromise = result instanceof Promise;
      if (isPromise) await result;
    }
  }

  protected async runQuery(query: string) {
    if (!this.started) {
      throw new InternalServerError({
        code: 'DATABASE:TRANSACTION:NOT_STARTED',
        message: 'The transaction has not started',
        metadata: { query },
      });
    }

    if (this.finished) {
      throw new InternalServerError({
        code: 'DATABASE:TRANSACTION:FINISHED',
        message: 'The transaction has already finished',
        metadata: { query },
      });
    }

    try {
      await this.client.query(query);
    } finally {
      this.finished = true;
      this.client.release();
    }
  }
}

enum KindHook {
  'ROLLBACK' = 'ROLLBACK',
  'COMMIT' = 'COMMIT',
}

type Hooks = { handle: HandleHook; kind: KindHook };
