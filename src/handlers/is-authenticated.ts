import { NextFunction, Request, Response } from 'express';

import { AuthType } from '@/enums';
import { UnauthorizedError } from '@/errors';

export const isAuthenticatedHandler =
  (type: AuthType) =>
  (request: Request, _response: Response, next: NextFunction) => {
    if (!request.context.jwt.sub) {
      throw new UnauthorizedError({
        code: 'jwt.sub-not-exist',
        message: 'middleware.jwt.sub-not-exist',
        sendToSlack: false,
      });
    }
    request.context.jwt.type = type;
    return next();
  };
