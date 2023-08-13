import { Repository } from '@/shared';

export class UserRepository extends Repository<User> {
  protected readonly tableName = 'users';

  public async getWithLimit(limit: number) {
    return this.findAll<GetWithLimitOutput>({
      columns: ['id', 'name', 'email'],
      limit,
    });
  }
}

type User = {
  id: string;
  name: string;
  email: string;
  birth_date: Date;
  password_hash: string;
  confirmed_email_at: Date | null;
  login_blocked_until: Date | null;
  code_to_envite: string;
};

type GetWithLimitOutput = {
  id: string;
  name: string;
  email: string;
};
