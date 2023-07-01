export { PasswordHashBcrypt } from './bcrypt';

export interface PasswordHash {
  create(password: string): Promise<string>;
  compare(plainTextPassword: string, hashedPassword: string): Promise<boolean>;
}
