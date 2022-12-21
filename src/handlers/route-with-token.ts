import { NextFunction, Request, Response } from 'express';

import { InternalServerError, UnauthorizedError } from '@/errors';
import { Env, Jwt } from '@/shared';

export const routeWithTokenHandler = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const { token } = request.context.jwt;
  if (!token?.trim())
    throw new InternalServerError({
      message: 'Token missing in the request.',
      sendToSlack: false,
    });
  if (token === Env.get('API_KEY')) return next();
  try {
    request.context.jwt = (await Jwt.decode(token)) as any;
  } catch (e: any) {
    throw new UnauthorizedError({
      message: e.message,
      sendToSlack: false,
      originalError: e,
    });
  }
  return next();
};
