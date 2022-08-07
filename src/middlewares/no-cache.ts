import { NextFunction, Request, Response } from 'express';

export const noCacheMiddleware = (
  _request: Request,
  response: Response,
  next: NextFunction,
) => {
  response.header('Expires', '0');
  response.header('Pragma', 'no-cache');
  response.header('Surrogate-Control', 'no-store');
  response.header(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  );

  return next();
};
