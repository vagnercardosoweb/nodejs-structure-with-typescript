import { Route } from '@/rest-api/types';
import { HttpStatusCode } from '@/shared/enums';

const sendStatusOk = (_: any, r: any) => r.sendStatus(HttpStatusCode.OK);

export const routes: Route[] = [
  {
    path: '/favicon.ico',
    handler: sendStatusOk,
    isPublic: true,
  },
  {
    path: '/',
    isPublic: true,
    handler: async (request, response) => {
      const path = `${request.method.toUpperCase()} ${request.originalUrl}`;
      const timestamp = new Date().toISOString();
      return response.json({
        data: '🚀',
        timestamp,
        ipAddress: request.ip,
        path,
      });
    },
  },
];
