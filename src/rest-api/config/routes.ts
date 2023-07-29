import { userRoutes } from '@/modules/users';
import { swaggerRoutes } from '@/rest-api/swagger';
import { Route } from '@/rest-api/types';
import { Env, Utils } from '@/shared';
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
      return response.json({
        data: '🚀',
        utcDate: Utils.createUtcDate(),
        brlDate: Utils.createBrlDate(),
        timezone: Env.getTimezoneGlobal(),
        ipAddress: request.ip,
        requestId: request.context.requestId,
        path,
      });
    },
  },
  ...userRoutes,
  ...swaggerRoutes,
];
