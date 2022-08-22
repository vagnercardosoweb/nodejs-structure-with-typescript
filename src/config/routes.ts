import { RequestHandler } from 'express';

import { AuthType, HttpMethod } from '@/enums';

export type Route = {
  path: string;
  method?: HttpMethod;
  handler: RequestHandler;
  middlewares?: RequestHandler[];
  roles?: string[];
  permissions?: string[];
  authType?: AuthType;
};

const configRoutes: Route[] = [
  {
    path: '/',
    handler: (_, response) =>
      response.json({
        date: new Date().toISOString(),
        message: 'Hello World!',
      }),
  },
];

export default configRoutes;
