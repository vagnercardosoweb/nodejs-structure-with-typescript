import { NextFunction, Request, Response } from 'express';

import { makeRequestContext } from '@/config/make-request-context';
import { Translation } from '@/translations';

export const configureAppHandler = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  request.context = makeRequestContext();
  Translation.setLocale(
    request
      .acceptsLanguages()
      .map((language) => language.toLowerCase())
      .at(0) ?? 'pt-br',
  );
  return next();
};
