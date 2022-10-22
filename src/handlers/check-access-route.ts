import { NextFunction, Request, Response } from 'express';

import { Logger } from '@/shared';

export const checkAccessByRouteHandler = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  Logger.info('path', { path: request.path });
  Logger.info('method', { method: request.method });
  Logger.info('route', { route: request.route });

  return next();
};
