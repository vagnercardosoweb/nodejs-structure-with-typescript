import { Repository } from '@/shared';

export class UserRepository extends Repository<UserRow> {
  protected readonly tableName = 'users';
  protected readonly primaryKey = 'id';
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  birth_date: Date;
  password_hash: string;
  confirmed_email_at: Date | null;
  login_blocked_until: Date | null;
  code_to_envite: string;
};
