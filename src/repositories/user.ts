import { Repository } from '@/shared';

export class UserRepository extends Repository<User> {
  protected readonly tableName = 'users';

  public async findWithLimit(limit: number, offset = -1) {
    return this.findAndCountAll<All>({
      columns: ['id', 'name', 'email'],
      orderBy: ['created_at DESC'],
      offset,
      limit,
    });
  }
}

type User = {
  id: string;
  name: string;
  email: string;
  birth_date: Date;
  code_to_invite: string;
  password_hash: string;
  confirmed_email_at: Date | null;
  login_blocked_until: Date | null;
  created_at: Date;
  deleted_at: Date | null;
  updated_at: Date;
};

type All = Pick<User, 'id' | 'name' | 'email'>;
