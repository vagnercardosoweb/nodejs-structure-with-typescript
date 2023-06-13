import { userRoutes } from '@/modules/users';
import { swaggerRoutes } from '@/rest-api/swagger';
import { Route } from '@/rest-api/types';
import { HttpStatusCode } from '@/shared/enums';

export const routes: Route[] = [
  {
    path: '/favicon.ico',
    handler: (_: any, r: any) => r.sendStatus(HttpStatusCode.OK),
    public: true,
  },
  {
    path: '/',
    public: true,
    handler: async (request, response) => {
      const path = `${request.method} ${request.originalUrl}`;
      const timestamp = new Date().toISOString();
      return response.json({
        data: '🚀',
        timestamp,
        ipAddress: request.ip,
        path,
      });
    },
  },
  ...userRoutes,
  ...swaggerRoutes,
];
