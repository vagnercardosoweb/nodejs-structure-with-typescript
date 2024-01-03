import { randomUUID } from 'node:crypto';

import { setupDependencies } from '@/rest-api/dependencies';
import { setupHandlers } from '@/rest-api/handlers';
import { RestApi } from '@/rest-api/rest-api';

export const createRestApi = async () => {
  const restApi = new RestApi(0, randomUUID());
  await setupDependencies(restApi);
  setupHandlers(restApi);
  restApi.startHandlers();
  return restApi;
};
