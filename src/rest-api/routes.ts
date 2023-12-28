import { HealthyHandler, UserListAllHandler } from '@/rest-api/handlers';
import { swaggerRoutes } from '@/rest-api/swagger';
import { Route } from '@/rest-api/types';
import { HttpMethod, HttpStatusCode } from '@/shared/enums';

export const routes: Route[] = [
  { path: '/', method: HttpMethod.GET, handler: HealthyHandler },
  {
    path: '/favicon.ico',
    method: HttpMethod.GET,
    handler: (_: any, r: any) => r.sendStatus(HttpStatusCode.NO_CONTENT),
  },

  ...swaggerRoutes,

  { path: '/users', handler: UserListAllHandler, method: HttpMethod.GET },
];
