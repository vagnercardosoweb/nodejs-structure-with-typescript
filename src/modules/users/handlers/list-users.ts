import { UserRepository } from '@/modules/users';
import { AbstractHandler } from '@/rest-api/handler';

export class ListUserHandler extends AbstractHandler {
  public async handle() {
    const userRepository = new UserRepository(this.pgPool);
    return userRepository.all();
  }
}
