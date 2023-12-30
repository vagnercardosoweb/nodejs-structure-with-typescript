import { NextFunction, Request, Response } from 'express';

import { ContainerName } from '@/shared/container';
import { Env } from '@/shared/env';
import { UnauthorizedError } from '@/shared/errors';
import { JwtInterface } from '@/shared/jwt';

export const withToken = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const { token } = request.jwt;
  if (!token?.trim()) throw new UnauthorizedError({ code: 'JwtTokenIsEmpty' });
  if (token === Env.get('API_KEY')) return next();
  if (token.split('.').length !== 3) {
    throw new UnauthorizedError({ code: 'JwtTokenInvalidFormat' });
  }
  try {
    request.jwt = request.container
      .get<JwtInterface>(ContainerName.JWT)
      .decode(token) as any;
  } catch (e: any) {
    throw new UnauthorizedError({
      originalError: e,
      code: 'JwtTokenValidationFailed',
    });
  }
  return next();
};
