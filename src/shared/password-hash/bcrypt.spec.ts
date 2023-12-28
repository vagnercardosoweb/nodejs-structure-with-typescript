import { beforeEach, describe, expect, it } from 'vitest';

import { PasswordHash, PasswordHashBcrypt } from '@/shared/password-hash';

describe('shared/password-hash', () => {
  process.env.BCRYPT_SALT_ROUNDS = '1';
  let sut: PasswordHash;

  beforeEach(() => {
    sut = new PasswordHashBcrypt();
  });

  it('should correctly hash a password', async () => {
    const plainTextPassword = 'any_password';
    const hashedPassword = await sut.create(plainTextPassword);
    expect(
      sut.compare(plainTextPassword, hashedPassword),
    ).resolves.toBeTruthy();
  });

  it('should compare an invalid password', async () => {
    const hashedPassword = await sut.create('any_password');
    expect(
      sut.compare('invalid_password', hashedPassword),
    ).resolves.toBeFalsy();
  });
});
