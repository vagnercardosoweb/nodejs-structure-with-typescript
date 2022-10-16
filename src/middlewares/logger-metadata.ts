import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const loggerMetadataMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const uuid = randomUUID();
  request.app.locals.requestId = uuid;
  response.setHeader('X-Request-Id', uuid);
  return next();
};
