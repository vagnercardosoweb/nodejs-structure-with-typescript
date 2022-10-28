import swagger from 'swagger-ui-express';

import { noCacheHandler } from '@/handlers';
import { App } from '@/server/app';

import swaggerComponents from './components';
import swaggerInfo from './info';
import swaggerPaths from './paths';
import swaggerServers from './servers';
import swaggerTags from './tags';

export const createSwapperDoc = (app: App) => {
  app.getApp().use(
    '/api-docs',
    noCacheHandler,
    swagger.serve,
    swagger.setup({
      openapi: '3.0.3',
      info: swaggerInfo,
      security: [{ bearerAuth: [] }],
      tags: swaggerTags,
      paths: swaggerPaths,
      components: swaggerComponents,
      servers: swaggerServers,
      externalDocs: {},
    }),
  );
};
