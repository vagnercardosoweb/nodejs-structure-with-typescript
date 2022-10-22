import { NextFunction, Request, Response } from 'express';

import { MethodNotAllowedError, PageNotFoundError } from '@/errors';

export const notFoundHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const errorOptions = {
    path: request.path,
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
