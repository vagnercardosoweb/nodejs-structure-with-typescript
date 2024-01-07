import { NextFunction, Request, Response } from 'express';

import { getJwtFromRequest } from '@/rest-api/dependencies';
import { Env } from '@/shared/env';
import { UnauthorizedError } from '@/shared/errors';

export const withToken = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const { token } = request.jwt;
  if (token === Env.get('API_KEY')) return next();

  if (token.split('.').length !== 3) {
    throw new UnauthorizedError({
      originalError: { message: 'The token does not have a valid format.' },
      code: 'JwtInvalidFormat',
    });
  }

  request.jwt = getJwtFromRequest(request).verify(token);

  return next();
};
