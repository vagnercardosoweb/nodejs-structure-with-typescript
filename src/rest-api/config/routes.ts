import { userRoutes } from '@/modules/users';
import { HealthyHandler } from '@/rest-api/handlers/healthy';
import { swaggerRoutes } from '@/rest-api/swagger';
import { Route } from '@/rest-api/types';
import { HttpStatusCode } from '@/shared';

export const routes: Route[] = [
  { path: '/', handler: HealthyHandler, public: true },
  {
    path: '/favicon.ico',
    handler: (_: any, r: any) => r.sendStatus(HttpStatusCode.OK),
    public: true,
  },
  ...swaggerRoutes,
  ...userRoutes,
];
