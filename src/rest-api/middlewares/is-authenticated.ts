import { NextFunction, Request, Response } from 'express';

import { AuthType } from '@/shared/enums';
import { InternalServerError } from '@/shared/errors';

export const isAuthenticated =
  (type: AuthType) =>
  (request: Request, _response: Response, next: NextFunction) => {
    if (!request.context.jwt.sub) {
      throw new InternalServerError({
        code: 'jwt.sub-not-exist',
        message: 'middleware.jwt.sub-not-exist',
        sendToSlack: false,
      });
    }
    request.context.jwt.type = type;
    return next();
  };
