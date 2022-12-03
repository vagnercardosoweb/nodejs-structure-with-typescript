import { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '@/errors';
import { Env, Jwt } from '@/shared';

export const routeWithTokenHandler = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  try {
    const { token } = request.context.jwt;
    if (!token) throw new Error('Token missing in the request.');
    if (token !== Env.get('API_KEY')) {
      request.context.jwt = (await Jwt.decode(token)) as any;
    }
  } catch (e: any) {
    throw new UnauthorizedError({
      message: e.message,
      originalError: e,
    });
  }
  return next();
};
