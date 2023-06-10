import bcrypt from 'bcryptjs';

import { Env } from '@/shared';

import { PasswordHash } from './index';

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

  private async generateSalt(): Promise<string> {
    const rounds = Env.get('BCRYPT_SALT_ROUNDS', 10);
    return bcrypt.genSalt(rounds);
  }
}
