import { UserRepository } from '@/repositories';
import { AbstractHandler } from '@/rest-api/handler';
import { UserListAllSvc } from '@/services';
import { Pagination } from '@/shared/pagination';

export class UserListAllHandler extends AbstractHandler {
  public async handle() {
    const pagination = Pagination.fromRequest(this.request);
    const userListSvc = new UserListAllSvc(new UserRepository(this.pgPool));
    const { rows, total } = await userListSvc.execute(pagination);
    return pagination.toJSON(rows, total);
  }
}
