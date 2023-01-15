import { NextFunction, Request, Response } from 'express';

import { makeRequestContext } from '@/config/make-request-context';
import { Logger } from '@/shared';
import { Translation } from '@/translations';

export const configureAppHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  request.context = makeRequestContext();
  request.logger = Logger.newInstance(`REQ:${request.context.requestId}`);
  response.setHeader('X-Request-Id', request.context.requestId);
  Translation.setLocale(
    request
      .acceptsLanguages()
      .map((language) => language.toLowerCase())
      .at(0) ?? 'pt-br',
  );
  return next();
};
