import { NextFunction, Request, Response } from 'express';

export const withPermission = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  request.logger.info('path', { path: request.path });
  request.logger.info('method', { method: request.method });
  request.logger.info('route', { route: request.route });
  return next();
};
