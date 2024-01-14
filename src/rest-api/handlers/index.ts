import { RestApi } from '@/rest-api/rest-api';
import { HttpMethod, HttpStatusCode } from '@/shared/enums';

import { Healthy } from './healthy';

const faviconHandler = (_: any, r: any) =>
  r.sendStatus(HttpStatusCode.NO_CONTENT);

export const setupHandlers = (restApi: RestApi) => {
  restApi.addHandler(HttpMethod.GET, '/healthy', Healthy.handle);
  restApi.addHandler(HttpMethod.GET, '/favicon.ico', faviconHandler);
};
