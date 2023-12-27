import { HealthyHandler } from '@/rest-api/handlers/healthy';
import { userRoutes } from '@/rest-api/routes/user';
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
  ...userRoutes,
];
