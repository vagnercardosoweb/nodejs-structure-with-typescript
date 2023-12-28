export { PasswordHashBcrypt } from './bcrypt';

export interface PasswordHash {
  create(plainTexPassword: string): Promise<string>;
  compare(plainTextPassword: string, hashedPassword: string): Promise<boolean>;
}
