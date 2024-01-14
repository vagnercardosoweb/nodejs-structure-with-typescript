import { NextFunction, Request, Response } from 'express';

import { MethodNotAllowedError, PageNotFoundError } from '@/shared/errors';

export const notFound = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const path = request.originalUrl || request.url;
  if (path === '/') return response.status(404).end();

  const errorOptions = {
    path,
    requestId: request.requestId,
    method: request.method,
  };

  const originalMethod = request.originalMethod || request.method;
  if (originalMethod.toUpperCase() !== request.method.toUpperCase()) {
    return next(new MethodNotAllowedError(errorOptions));
  }

  return next(new PageNotFoundError(errorOptions));
};
