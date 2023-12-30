import { NextFunction, Request, Response } from 'express';

import { MethodNotAllowedError, PageNotFoundError } from '@/shared/errors';

export const notFound = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const errorOptions = {
    path: request.originalUrl || request.url,
    requestId: request.requestId,
    method: request.method,
  };
  const originalMethod = request.originalMethod || request.method;
  if (originalMethod.toUpperCase() !== request.method.toUpperCase()) {
    return next(new MethodNotAllowedError(errorOptions));
  }
  return next(new PageNotFoundError(errorOptions));
};
