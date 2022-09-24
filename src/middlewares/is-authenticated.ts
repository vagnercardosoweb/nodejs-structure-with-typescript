import { NextFunction, Request, Response } from 'express';

import { AuthType } from '@/enums';
import { UnauthorizedError } from '@/errors';

export const isAuthenticatedMiddleware =
  (type: AuthType) =>
  (request: Request, _response: Response, next: NextFunction) => {
    if (!request.app.locals.jwt?.sub) {
      throw new UnauthorizedError({
        code: 'jwt.sub-not-exist',
        message: 'middleware.jwt.sub-not-exist',
      });
    }
    request.app.locals.jwt.type = type;
    return next();
  };
