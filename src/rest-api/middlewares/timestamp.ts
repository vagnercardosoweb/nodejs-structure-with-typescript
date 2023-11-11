import { NextFunction, Request, Response } from 'express';

import { Utils } from '@/shared';

export const timestamp = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (request.path === '/timestamp') {
    return response.json({
      utc: Utils.createUtcDate().getTime(),
      duration: request.durationTime.format(),
      brl: Utils.createBrlDate().getTime(),
    });
  }
  return next();
};
