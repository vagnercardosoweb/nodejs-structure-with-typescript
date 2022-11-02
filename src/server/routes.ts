import { RequestHandler } from 'express';

import { AuthType, HttpMethod, HttpStatusCode } from '@/enums';

export type Route = {
  path: string;
  method?: HttpMethod;
  handler: RequestHandler;
  handlers?: RequestHandler[];
  authType?: AuthType;
  public?: boolean;
};

const appRoutes: Route[] = [
  {
    path: '/',
    public: true,
    handler: async (request, response) => {
      return response.json({
        date: new Date().toISOString(),
        ipAddress: request.ip,
        agent: request.header('User-Agent'),
      });
    },
  },
  {
    path: '/favicon.ico',
    public: true,
    handler: (_, response) => response.sendStatus(HttpStatusCode.OK),
  },
];

export default appRoutes;
