import { HealthyHandler } from '@/rest-api/handlers';
import { RestApi } from '@/rest-api/rest-api';
import { HttpMethod, HttpStatusCode } from '@/shared/enums';

const faviconHandler = (_: any, r: any) =>
  r.sendStatus(HttpStatusCode.NO_CONTENT);

export const setupRoutes = (restApi: RestApi) => {
  restApi.addRoute(HttpMethod.GET, '/', HealthyHandler.handle);
  restApi.addRoute(HttpMethod.GET, '/favicon.ico', faviconHandler);
};
