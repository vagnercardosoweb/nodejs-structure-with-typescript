import { Repository } from '@/shared';

export class UserRepository extends Repository<User> {
  protected readonly tableName = 'users';

  public async all() {
    return this.getMany<GetWithLimitOutput>({
      columns: ['id', 'name', 'email'],
      orderBy: ['created_at DESC'],
      limit: -1,
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
  code_to_invite: string;
};

type GetWithLimitOutput = {
  id: string;
  name: string;
  email: string;
};
