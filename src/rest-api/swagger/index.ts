import swagger from 'swagger-ui-express';

import { noCache } from '@/rest-api/middlewares';
import { Route } from '@/rest-api/types';
import { HttpMethod } from '@/shared/enums';

import components from './components';
import info from './info';
import paths from './paths';
import servers from './servers';
import tags from './tags';

export const swaggerRoutes: Route[] = [
  {
    path: '/api-docs',
    method: HttpMethod.USE,
    public: true,
    middlewares: [noCache, ...swagger.serve],
    handler: swagger.setup({
      openapi: '3.0.3',
      security: [{ bearerAuth: [] }],
      externalDocs: {},
      info,
      components,
      paths,
      servers,
      tags,
    }),
  },
];
