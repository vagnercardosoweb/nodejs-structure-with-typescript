import swagger from 'swagger-ui-express';

import { noCache } from '@/rest-api/middlewares';
import { RestApi } from '@/rest-api/rest-api';
import { HttpMethod } from '@/shared/enums';

import components from './components';
import info from './info';
import paths from './paths';
import servers from './servers';
import tags from './tags';

export const createSwaggerRoute = (api: RestApi) => {
  api.addRoute({
    path: '/api-docs',
    method: HttpMethod.USE,
    isPublic: true,
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
  });
};
