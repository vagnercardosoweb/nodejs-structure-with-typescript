import { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '@/errors';
import { Env, Jwt } from '@/shared';

export const routeWithTokenHandler = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  request.app.locals.jwt = null;
  try {
    const { token } = request.app.locals;
    if (!token) throw new Error('Token missing in the request.');
    if (token !== Env.get('API_KEY')) {
      request.app.locals.jwt = await Jwt.decode(token);
    }
  } catch (e: any) {
    throw new UnauthorizedError({
      message: e.message,
      originalError: e,
    });
  }
  return next();
};
