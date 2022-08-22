import { NextFunction, Request, Response, Router } from 'express';

import configRoutes from '@/config/routes';
import { AuthType, HttpMethod } from '@/enums';
import { routeWithTokenMiddleware } from '@/middlewares';

const appRoutes = Router({
  mergeParams: true,
  caseSensitive: true,
  strict: true,
});

appRoutes.get('/favicon.ico', (_, response) => response.sendStatus(200));

const checkRoleMiddleware =
  (roles: string[]) =>
  async (request: Request, response: Response, next: NextFunction) => {
    console.log('roles', roles);
    return next();
  };

const checkPermissionMiddleware =
  (permissions: string[]) =>
  async (request: Request, response: Response, next: NextFunction) => {
    console.log('permissions', permissions);
    return next();
  };

const checkAccessByRouteMiddleware = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  console.log('path', request.path);
  console.log('method', request.method);
  console.log('route', request.route);

  return next();
};

export const checkAuthTypeMiddleware =
  (authType: AuthType) =>
  (request: Request, response: Response, next: NextFunction) => {
    console.log('authType', authType);
    return next();
  };

configRoutes.forEach((route) => {
  route.method = route.method ?? HttpMethod.GET;
  route.roles = route.roles ?? [];
  route.permissions = route.permissions ?? [];
  route.middlewares = route.middlewares ?? [];
  route.authType = route.authType ?? AuthType.NORMAL;

  (<any>appRoutes)[route.method.toLowerCase()](
    route.path,
    routeWithTokenMiddleware,
    checkAuthTypeMiddleware(route.authType),
    checkAccessByRouteMiddleware,
    checkRoleMiddleware(route.roles),
    checkPermissionMiddleware(route.permissions),
    ...route.middlewares,
    route.handler,
  );
});

export default appRoutes;
