import crypto from 'node:crypto';

export class Encryption {
  private readonly size = 32;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly secretKey: string) {}

  public async encrypt(payload: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const iv = crypto.randomBytes(this.size / 2);
        const salt = crypto.randomBytes(this.size * 2);
        const cipher = crypto.createCipheriv(
          this.algorithm,
          this.generateKey(salt),
          iv,
        );
        const encrypted = Buffer.concat([
          cipher.update(JSON.stringify(payload)),
          cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        resolve(
          Buffer.from(
            JSON.stringify({
              iv: iv.toString('hex'),
              salt: salt.toString('hex'),
              encrypted: encrypted.toString('hex'),
              authTag: authTag.toString('hex'),
            }),
          ).toString('base64'),
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  public async decrypt<T = any>(value: string): Promise<T> {
    return new Promise<any>((resolve, reject) => {
      try {
        const { iv, encrypted, salt, authTag } = this.getPayload(value);
        const key = this.generateKey(salt);
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([
          decipher.update(encrypted),
          decipher.final(),
        ]).toString();
        resolve(JSON.parse(decrypted));
      } catch (e) {
        reject(e);
      }
    });
  }

  private getPayload(value: string): {
    iv: Buffer;
    encrypted: Buffer;
    salt: Buffer;
    authTag: Buffer;
  } {
    const payload = Buffer.from(value, 'base64');
    const { iv, encrypted, salt, authTag } = JSON.parse(payload.toString());
    return {
      iv: Buffer.from(iv, 'hex'),
      encrypted: Buffer.from(encrypted, 'hex'),
      salt: Buffer.from(salt, 'hex'),
      authTag: Buffer.from(authTag, 'hex'),
    };
  }

  private generateKey(salt: Buffer): Buffer {
    const result = crypto.pbkdf2Sync(
      this.secretKey,
      salt,
      100000,
      this.size,
      'sha512',
    );
    return result;
  }
}
