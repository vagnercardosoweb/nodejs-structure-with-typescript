import bcrypt from 'bcryptjs';

import { PasswordHashInterface } from '@/shared/password-hash';

export class PasswordHashBcrypt implements PasswordHashInterface {
  public constructor(protected readonly saltRounds: number) {}

  public async compare(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  public async create(planTextPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(planTextPassword, salt);
  }
}
