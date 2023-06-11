import { AbstractHandler } from '@/rest-api/handler';
import { ContainerName, DbConnectionInterface } from '@/shared';

export class ListUserHandler extends AbstractHandler {
  public async handle() {
    const result = await this.container
      .get<DbConnectionInterface>(ContainerName.DB_CONNECTION)
      .query('SELECT * FROM users ORDER BY name LIMIT 10');
    return result.rows;
  }
}
