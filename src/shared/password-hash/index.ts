export { PasswordHashBcrypt } from './bcrypt';

export interface PasswordHashInterface {
  create(plainTexPassword: string): Promise<string>;
  compare(plainTextPassword: string, hashedPassword: string): Promise<boolean>;
}
