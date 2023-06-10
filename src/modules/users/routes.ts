import { ListUserHandler } from '@/modules/users/handlers/list-users';
import { RestApi } from '@/rest-api/rest-api';
import { ContainerName, HttpMethod } from '@/shared';
import { DbConnectionInterface } from '@/shared/postgres/types';

export const createUserRoutes = (api: RestApi) => {
  const db = api.get<DbConnectionInterface>(ContainerName.DB_CONNECTION);
  const listUserHandler = new ListUserHandler(db);

  api.addRoute({
    path: '/users',
    method: HttpMethod.GET,
    isPublic: true,
    handler: listUserHandler.handle.bind(listUserHandler),
  });
};
