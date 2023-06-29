import { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '@/shared/errors';

export const extractToken = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  let token: string | undefined = String(request.query.token).trim();
  const { authorization } = request.headers;
  if (authorization) {
    const [, authToken] = authorization.split(' ');
    if (!authToken?.trim()) {
      throw new UnauthorizedError({
        description: 'Header with BEARER but without TOKEN.',
        sendToSlack: false,
      });
    }
    token = authToken.trim();
  }
  if (token === 'undefined' || !token?.length) token = undefined;
  request.context.jwt.token = token as any;
  return next();
};
