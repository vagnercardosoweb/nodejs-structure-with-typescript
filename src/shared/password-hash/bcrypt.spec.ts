import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { PasswordHashBcrypt } from './bcrypt';
import { PasswordHash } from './index';

bcrypt.hash = vi.fn().mockResolvedValue('hashed_password');
bcrypt.genSalt = vi.fn().mockResolvedValue('any_salt');
bcrypt.compare = vi.fn().mockResolvedValue(true);

let sut: PasswordHash;

describe('PasswordHashBcrypt', () => {
  beforeEach(() => {
    sut = new PasswordHashBcrypt();
  });

  test('must hash a password', async () => {
    const hashedPassword = await sut.create('any_password');

    expect(hashedPassword).toEqual('hashed_password');

    expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    expect(bcrypt.hash).toHaveBeenCalledWith('any_password', 'any_salt');

    expect(bcrypt.genSalt).toHaveBeenCalledTimes(1);
    expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
  });

  test('must compare a plaintext password with a hashed one', async () => {
    const hashedPassword = 'hashed_password';
    const plainTextPassword = 'any_password';

    const comparePassword = await sut.compare(
      plainTextPassword,
      hashedPassword,
    );

    expect(comparePassword).toBeTruthy();

    expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      plainTextPassword,
      hashedPassword,
    );
  });

  test('should return FALSE when comparing wrong passwords', async () => {
    (bcrypt.compare as Mock).mockResolvedValueOnce(false);
    const comparePassword = await sut.compare('any_password', 'wrong_password');

    expect(comparePassword).toBeFalsy();
  });

  test('should return an error when trying to generate a password and failing', async () => {
    (bcrypt.hash as Mock).mockRejectedValueOnce(new Error('any_error'));
    await expect(sut.create('any_password')).rejects.toThrow();
  });

  test('should return an error when comparing the password and fail', async () => {
    (bcrypt.compare as Mock).mockRejectedValueOnce(new Error('any_error'));
    await expect(
      sut.compare('any_password', 'hashed_password'),
    ).rejects.toThrow();
  });
});
