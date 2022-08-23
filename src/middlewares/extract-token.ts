import { NextFunction, Request, Response } from 'express';

export const extractTokenMiddleware = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  let token: string | null = String(request.query.token).trim();
  const { authorization } = request.headers;

  if (authorization) {
    const [, authToken] = authorization.split(' ');
    token = authToken.trim();
  }

  if (token === 'undefined' || !token?.length) token = null;
  request.app.locals.token = token;

  return next();
};
