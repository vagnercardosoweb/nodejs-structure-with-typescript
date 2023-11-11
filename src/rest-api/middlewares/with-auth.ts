import { NextFunction, Request, Response } from 'express';

import { AuthType } from '@/shared/enums';
import { UnauthorizedError } from '@/shared/errors';

export const withAuth =
  (type: AuthType) =>
  (request: Request, _response: Response, next: NextFunction) => {
    if (!request.context.jwt.sub) {
      throw new UnauthorizedError({ code: 'JwtSubNotFound' });
    }
    request.context.jwt.type = type;
    return next();
  };
