import { BaseRepository } from '@/shared/postgres';
import { User } from '@/types';

export class UserRepository extends BaseRepository<User> {
  protected readonly tableName = 'users';

  public async findWithLimit(limit: number, offset = -1) {
    return this.findAndCountAll<Pick<User, 'id' | 'name' | 'email'>>({
      columns: ['id', 'name', 'email'],
      orderBy: ['created_at DESC'],
      offset,
      limit,
    });
  }
}
