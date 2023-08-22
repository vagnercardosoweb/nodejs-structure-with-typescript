import { userRoutes } from '@/modules/users';
import { HealthyHandler } from '@/rest-api/handlers/healthy';
import { swaggerRoutes } from '@/rest-api/swagger';
import { Route } from '@/rest-api/types';
import { HttpMethod, HttpStatusCode } from '@/shared';

export const routes: Route[] = [
  {
    path: '/',
    method: HttpMethod.GET,
    handler: HealthyHandler,
  },
  {
    path: '/favicon.ico',
    method: HttpMethod.GET,
    handler: (_: any, r: any) => r.sendStatus(HttpStatusCode.OK),
  },
  ...swaggerRoutes,
  ...userRoutes,
];
