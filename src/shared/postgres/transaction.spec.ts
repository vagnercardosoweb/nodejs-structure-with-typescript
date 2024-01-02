import {
  PgPoolInterface,
  Transaction,
  TransactionInterface,
} from '@/shared/postgres';

describe('shared/postgres/transaction', () => {
  const duplicateErrorMessage = /^The transaction has already finished$/;
  const notStartedErrorMessage = /^The transaction has not started$/;

  const mockPgPool = { query: vi.fn(), release: vi.fn() };
  let transaction: TransactionInterface;

  beforeEach(() => {
    transaction = new Transaction(mockPgPool as unknown as PgPoolInterface);
  });

  it('should execute the "begin" method successfully and only once', async () => {
    expect((transaction as any).started).toBeFalsy();
    await transaction.begin();
    expect((transaction as any).started).toBeTruthy();
    await transaction.begin();
    expect(mockPgPool.query).toHaveBeenCalledTimes(1);
    expect(mockPgPool.query).toHaveBeenCalledWith('BEGIN');
  });

  it('should execute the "commit" method successfully', async () => {
    await transaction.begin();
    expect((transaction as any).started).toBeTruthy();
    await transaction.commit();
    expect(mockPgPool.query).toHaveBeenCalledTimes(2);
    expect(mockPgPool.query).toHaveBeenCalledWith('BEGIN');
    expect(mockPgPool.query).toHaveBeenCalledWith('COMMIT');
    expect(mockPgPool.release).toHaveBeenCalledOnce();
  });

  it('should execute the "rollback" method successfully', async () => {
    await transaction.begin();
    expect((transaction as any).started).toBeTruthy();
    await transaction.rollback();
    expect(mockPgPool.query).toHaveBeenCalledTimes(2);
    expect(mockPgPool.query).toHaveBeenCalledWith('BEGIN');
    expect(mockPgPool.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockPgPool.release).toHaveBeenCalledOnce();
  });

  it('should execute the "commit" method in duplicate and return an error', async () => {
    await transaction.begin();
    expect((transaction as any).started).toBeTruthy();
    await transaction.commit();
    expect(transaction.commit()).rejects.toThrow(duplicateErrorMessage);
  });

  it('should execute the "rollback" method in duplicate and return an error', async () => {
    await transaction.begin();
    expect((transaction as any).started).toBeTruthy();
    await transaction.rollback();
    expect(transaction.rollback()).rejects.toThrow(duplicateErrorMessage);
  });

  it('should execute the "rollback" method without having started the transaction', async () => {
    expect((transaction as any).started).toBeFalsy();
    expect(transaction.rollback()).rejects.toThrowError(notStartedErrorMessage);
    expect(mockPgPool.query).toHaveBeenCalledTimes(0);
  });

  it('should execute the "commit" method without having started the transaction', async () => {
    expect((transaction as any).started).toBeFalsy();
    expect(transaction.commit()).rejects.toThrowError(notStartedErrorMessage);
    expect(mockPgPool.query).toHaveBeenCalledTimes(0);
  });

  it('should execute the "rollback" method with the "afterRollback" hook successfully', async () => {
    await transaction.begin();
    const fn = vi.fn().mockResolvedValueOnce('OK');
    transaction.afterRollback(fn);
    await transaction.rollback();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(mockPgPool);
  });

  it('should execute the "rollback" method with the "afterRollback" hook and fail', async () => {
    await transaction.begin();
    const fn = vi.fn().mockRejectedValueOnce(new Error());
    transaction.afterRollback(fn);
    expect(transaction.rollback()).rejects.toThrow();
    expect(mockPgPool.query).toHaveBeenCalledTimes(2);
  });

  it('should execute the "rollback" method with the "afterCommit" hook successfully', async () => {
    await transaction.begin();
    const fn = vi.fn().mockReturnValueOnce('OK');
    transaction.afterCommit(fn);
    await transaction.commit();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(mockPgPool);
  });

  it('should execute the "rollback" method with the "afterCommit" hook and fail', async () => {
    await transaction.begin();
    const fn = vi.fn().mockRejectedValueOnce(new Error());
    transaction.afterCommit(fn);
    expect(transaction.commit()).rejects.toThrow();
    expect(mockPgPool.query).toHaveBeenCalledTimes(2);
  });
});
