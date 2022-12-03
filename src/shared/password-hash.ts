import * as bcrypt from 'bcryptjs';

import { Env } from '@/shared/env';

export class PasswordHash {
  static async create(value: string) {
    return bcrypt.hash(value, await PasswordHash.generateSalt());
  }

  static async verify(value: string, hashed: string) {
    return bcrypt.compare(value, hashed);
  }

  static async generateSalt() {
    const rounds = Env.get('PASSWORD_HASH_SALT_ROUNDS', 12);
    return bcrypt.genSalt(rounds);
  }
}
