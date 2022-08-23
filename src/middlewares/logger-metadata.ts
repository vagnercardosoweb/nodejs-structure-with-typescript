import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const loggerMetadataMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const requestId = randomUUID();
  request.app.locals.requestId = requestId;
  response.setHeader('X-Request-Id', requestId);
  return next();
};
