import swagger from 'swagger-ui-express';

import { Route } from '@/rest-api/types';
import { HttpMethod } from '@/shared/enums';

import components from './components';
import info from './info';
import paths from './paths';
import servers from './servers';
import tags from './tags';

export const swaggerRoutes: Route[] = [
  {
    path: '/docs',
    method: HttpMethod.USE,
    middlewares: [...swagger.serve],
    handler: swagger.setup({
      openapi: '3.1.0',
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
