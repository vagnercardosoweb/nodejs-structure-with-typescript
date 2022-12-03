import { NextFunction, Request, Response } from 'express';

export const extractTokenHandler = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  let token: string | undefined = String(request.query.token).trim();
  const { authorization } = request.headers;
  if (authorization) {
    const [, authToken] = authorization.split(' ');
    token = authToken.trim();
  }
  if (token === 'undefined' || !token?.length) token = undefined;
  request.context.jwt.token = token as any;
  return next();
};
