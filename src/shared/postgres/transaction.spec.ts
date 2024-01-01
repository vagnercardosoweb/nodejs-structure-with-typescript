import {
  PgPoolInterface,
  Transaction,
  TransactionInterface,
} from '@/shared/postgres';

describe('shared/postgres/transaction', () => {
  const mockPgPool = { query: vi.fn(), release: vi.fn() };
  let transaction: TransactionInterface;

  beforeEach(() => {
    transaction = new Transaction(mockPgPool as unknown as PgPoolInterface);
  });

  it('deveria testar o método "begin"', async () => {
    expect((transaction as any).started).toBeFalsy();
    await transaction.begin();
    expect((transaction as any).started).toBeTruthy();
    await transaction.begin();
    expect(mockPgPool.query).toHaveBeenCalledTimes(1);
    expect(mockPgPool.query).toHaveBeenCalledWith('BEGIN');
  });

  it('deveria testar o método "commit"', async () => {
    await transaction.begin();
    expect((transaction as any).started).toBeTruthy();
    await transaction.commit();
    expect(mockPgPool.query).toHaveBeenCalledTimes(2);
    expect(mockPgPool.query).toHaveBeenCalledWith('BEGIN');
    expect(mockPgPool.query).toHaveBeenCalledWith('COMMIT');
    expect(mockPgPool.release).toHaveBeenCalledOnce();
  });

  it('deveria testar o método "rollback"', async () => {
    await transaction.begin();
    expect((transaction as any).started).toBeTruthy();
    await transaction.rollback();
    expect(mockPgPool.query).toHaveBeenCalledTimes(2);
    expect(mockPgPool.query).toHaveBeenCalledWith('BEGIN');
    expect(mockPgPool.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockPgPool.release).toHaveBeenCalledOnce();
  });

  it('deveria testar o método "commit" tentando executar 2 vezes', async () => {
    await transaction.begin();
    expect((transaction as any).started).toBeTruthy();
    await transaction.commit();
    expect(transaction.commit()).rejects.toThrow();
  });

  it('deveria testar o método "rollback" sem ter iniciado o "begin"', async () => {
    expect((transaction as any).started).toBeFalsy();
    expect(transaction.rollback()).rejects.toThrow();
  });

  it('deveria testar o método "rollback" com o hook "afterRollback" e não dar ero', async () => {
    await transaction.begin();
    const fn = vi.fn().mockResolvedValueOnce('OK');
    transaction.afterRollback(fn);
    await transaction.rollback();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(mockPgPool);
  });

  it('deveria testar o método "rollback" com o hook "afterRollback" e dar ero', async () => {
    await transaction.begin();
    const fn = vi.fn().mockRejectedValueOnce(new Error());
    transaction.afterRollback(fn);
    expect(transaction.rollback()).rejects.toThrow();
    expect(mockPgPool.query).toHaveBeenCalledTimes(2);
  });

  it('deveria testar o método "rollback" com o hook "afterCommit" e não dar ero', async () => {
    await transaction.begin();
    const fn = vi.fn().mockReturnValueOnce('OK');
    transaction.afterCommit(fn);
    await transaction.commit();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(mockPgPool);
  });

  it('deveria testar o método "rollback" com o hook "afterCommit" e dar ero', async () => {
    await transaction.begin();
    const fn = vi.fn().mockRejectedValueOnce(new Error());
    transaction.afterCommit(fn);
    expect(transaction.commit()).rejects.toThrow();
    expect(mockPgPool.query).toHaveBeenCalledTimes(2);
  });
});
