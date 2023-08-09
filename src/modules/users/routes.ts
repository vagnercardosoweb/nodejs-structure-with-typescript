import { ListUserHandler } from '@/modules/users/handlers/list-users';
import { Route } from '@/rest-api/types';
import { HttpMethod } from '@/shared';

export const userRoutes: Route[] = [
  {
    path: '/users',
    handler: ListUserHandler,
    method: HttpMethod.GET,
    public: true,
  },
];
