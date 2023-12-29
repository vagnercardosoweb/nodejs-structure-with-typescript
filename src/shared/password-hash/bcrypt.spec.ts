import { beforeEach, describe, expect, it } from 'vitest';

import {
  PasswordHashBcrypt,
  PasswordHashInterface,
} from '@/shared/password-hash';

describe('shared/password-hash', () => {
  let sut: PasswordHashInterface;

  beforeEach(() => {
    sut = new PasswordHashBcrypt(1);
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
