import { NextFunction, Request, Response } from 'express';

export const checkAccessByRouteMiddleware = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  console.log('path', request.path);
  console.log('method', request.method);
  console.log('route', request.route);

  return next();
};
