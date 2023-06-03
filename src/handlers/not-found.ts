import { NextFunction, Request, Response } from 'express';

import { MethodNotAllowedError, PageNotFoundError } from '@/errors';

export const notFoundHandler = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const errorOptions = {
    path: request.originalUrl || request.url,
    requestId: request.context.requestId,
    method: request.method,
  };
  if (
    (<any>request)?.originalMethod &&
    (<any>request).originalMethod.toUpperCase() !== request.method.toUpperCase()
  ) {
    return next(new MethodNotAllowedError(errorOptions));
  }
  return next(new PageNotFoundError(errorOptions));
};
