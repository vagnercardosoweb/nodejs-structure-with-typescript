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
    handler: async (request, response) =>
      response.json({
        data: '🚀',
        path: `${request.method} ${request.originalUrl}`,
        timezone: Env.getTimezoneGlobal(),
        requestId: request.context.requestId,
        ipAddress: request.ip,
        utcDate: Utils.createUtcDate(),
        brlDate: Utils.createBrlDate(),
      }),
  },
  ...userRoutes,
  ...swaggerRoutes,
];
