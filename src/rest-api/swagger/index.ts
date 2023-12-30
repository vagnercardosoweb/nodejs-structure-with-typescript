import swagger from 'swagger-ui-express';

import { RestApi } from '@/rest-api/rest-api';
import components from '@/rest-api/swagger/components';
import info from '@/rest-api/swagger/info';
import paths from '@/rest-api/swagger/paths';
import servers from '@/rest-api/swagger/servers';
import tags from '@/rest-api/swagger/tags';

export const setupSwagger = (restApi: RestApi) => {
  restApi.getExpress().use(
    '/docs',
    swagger.serve,
    swagger.setup({
      openapi: '3.1.0',
      security: [{ bearerAuth: [] }],
      externalDocs: {},
      info,
      components,
      paths,
      servers,
      tags,
    }),
  );
};
