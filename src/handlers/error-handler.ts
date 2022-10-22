import { NextFunction, Request, Response } from 'express';

import { parseToObject } from '@/errors';
import { Logger } from '@/shared';

export const errorHandler = (
  error: any,
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (response.headersSent) {
    return next(error);
  }
  const errorObject = parseToObject(error);
  Logger.error('error-handler-information', {
    path: request.path,
    method: request.method,
    cookies: request.cookies,
    headers: request.headers,
    params: request.params,
    query: request.query,
    body: request.body,
    locals: request.app.locals,
    errorObject,
  });
  response.statusCode = errorObject.statusCode;
  return response.json(errorObject);
};
