import { Healthy } from '@/rest-api/handlers/healthy';
import { RestApi } from '@/rest-api/rest-api';
import { HttpMethod, HttpStatusCode } from '@/shared/enums';

const faviconHandler = (_: any, r: any) =>
  r.sendStatus(HttpStatusCode.NO_CONTENT);

export const setupHandlers = (restApi: RestApi) => {
  restApi.addRoute(HttpMethod.GET, '/', Healthy.handle);
  restApi.addRoute(HttpMethod.GET, '/favicon.ico', faviconHandler);
};
