import { describe, expect, it, vi } from 'vitest';

import { Encryption } from '@/shared/encryption';

const encryption = new Encryption('any_key');

describe('shared/encryption', () => {
  it('should reject when encrypting', async () => {
    vi.spyOn(encryption as any, 'generateKey').mockReturnValueOnce('any');
    expect(() => encryption.encrypt('any_value')).rejects.toThrowError(
      'Invalid key length',
    );
  });

  it('should reject when decrypting an invalid encryption', async () => {
    expect(() => encryption.decrypt('any_value')).rejects.toThrowError(
      'Unexpected token \'j\', "j|���n" is not valid JSON',
    );
  });

  it('should create an encryption and validate the payload', async () => {
    const encrypted = await encryption.encrypt('any_value');
    const payload = JSON.parse(Buffer.from(encrypted, 'base64').toString());
    expect(payload.iv).toBeDefined();
    expect(payload.salt).toBeDefined();
    expect(payload.encrypted).toBeDefined();
    expect(payload.authTag).toBeDefined();
  });

  it('should create an encryption and validate the decrypt value [string]', async () => {
    const encrypted = await encryption.encrypt('any_value');
    const decrypted = await encryption.decrypt(encrypted);
    expect(decrypted).toEqual('any_value');
  });
});
