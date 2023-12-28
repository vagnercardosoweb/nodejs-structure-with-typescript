import bcrypt from 'bcryptjs';

import { Env } from '@/shared/env';
import { PasswordHash } from '@/shared/password-hash';

export class PasswordHashBcrypt implements PasswordHash {
  public async compare(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  public async create(planTextPassword: string): Promise<string> {
    const salt = await this.generateSalt();
    return bcrypt.hash(planTextPassword, salt);
  }

  protected async generateSalt(): Promise<string> {
    const rounds = Env.get('BCRYPT_SALT_ROUNDS', 12);
    return bcrypt.genSalt(rounds);
  }
}
