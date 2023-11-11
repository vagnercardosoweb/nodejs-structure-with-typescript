import { UserRepository } from '@/repositories';
import { AbstractHandler } from '@/rest-api/handler';
import { UserListAllSvc } from '@/services';
import { Pagination } from '@/shared';

export class ListAllHandler extends AbstractHandler {
  public async handle() {
    const pagination = Pagination.fromRequest(this.request);
    const { total, rows } = await new UserListAllSvc(
      new UserRepository(this.pgPool),
    ).execute(pagination);
    return pagination.toJSON(rows, total);
  }
}
