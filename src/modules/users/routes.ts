import { ListUserHandler } from '@/modules/users/handlers/list-users';
import { Route } from '@/rest-api/types';
import { HttpMethod } from '@/shared';

export const userRoutes: Route[] = [
  {
    path: '/users',
    method: HttpMethod.GET,
    handler: ListUserHandler,
    public: true,
  },
];
