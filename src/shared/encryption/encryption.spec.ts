import { describe, expect, it, vi } from 'vitest';

import { Utils } from '../utils';
import { Encryption } from './encryption';

const encryption = new Encryption('any_key');

describe('Ecryption', () => {
  it('should reject when encrypting', async () => {
    vi.spyOn(encryption as any, 'generateKey').mockReturnValueOnce('any');
    expect(() => encryption.encrypt('any_value')).rejects.toBeTruthy();
  });

  it('should reject when decrypting an invalid encryption', async () => {
    expect(() => encryption.decrypt('any_value')).rejects.toBeTruthy();
  });

  it('should create an encryption and validate the payload', async () => {
    const encrypted = await encryption.encrypt('any_value');
    const payload = Utils.parseJson(Utils.base64ToValue(encrypted));
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
