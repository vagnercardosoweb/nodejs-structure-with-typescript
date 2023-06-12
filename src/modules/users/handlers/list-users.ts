import { AbstractHandler } from '@/rest-api/handler';
import { ContainerName, PgPoolInterface } from '@/shared';

export class ListUserHandler extends AbstractHandler {
  public async handle() {
    const result = await this.container
      .get<PgPoolInterface>(ContainerName.PG_POOL)
      .query('SELECT * FROM users ORDER BY name LIMIT 10');
    return result.rows;
  }
}
