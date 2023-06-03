import { NextFunction, Request, Response } from 'express';

import { makeRequestContext } from '@/config/make-request-context';
import { Logger } from '@/shared';
import { Translation } from '@/translations';

export const configureAppHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  let language =
    request
      .acceptsLanguages()
      .map((language) => language.toLowerCase())
      .at(0) ?? '*';

  if (language === '*') language = 'pt-br';
  Translation.setLocale(language);

  request.context = makeRequestContext();
  response.setHeader('X-Request-Id', request.context.requestId);
  request.logger = Logger.newInstance(`REQ:${request.context.requestId}`);

  return next();
};
