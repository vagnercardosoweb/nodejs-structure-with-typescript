import { NextFunction, Request, Response } from 'express';

import { ContainerName, Env, JwtInterface } from '@/shared';
import { UnauthorizedError } from '@/shared/errors';

export const withToken = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const { token } = request.context.jwt;
  if (!token?.trim()) {
    throw new UnauthorizedError({
      message: 'token missing in the request',
      sendToSlack: false,
    });
  }
  if (token === Env.get('API_KEY')) return next();
  if (token.split('.').length !== 3) {
    throw new UnauthorizedError({
      code: 'auth.invalid-format-token',
      message: 'token does not have a valid format',
      sendToSlack: false,
    });
  }
  try {
    request.context.jwt = request.container
      .get<JwtInterface>(ContainerName.JWT)
      .decode(token) as any;
  } catch (e: any) {
    throw new UnauthorizedError({
      code: 'auth.invalid-token',
      message: 'unable to validate your token please login again',
      sendToSlack: false,
      original: e,
    });
  }
  return next();
};
