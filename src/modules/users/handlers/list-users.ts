import { UserRepository } from '@/modules/users';
import { AbstractHandler } from '@/rest-api/handler';
import { ContainerName } from '@/shared';

export class ListUserHandler extends AbstractHandler {
  public async handle() {
    const pgPool = this.container.get(ContainerName.PG_POOL);
    const userRepository = new UserRepository(pgPool);
    return userRepository.findAll({
      columns: ['id', 'name', 'email'],
      limit: 5,
    });
  }
}
