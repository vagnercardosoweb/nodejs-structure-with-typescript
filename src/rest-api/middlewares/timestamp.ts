import { NextFunction, Request, Response } from 'express';

import { createNewBrlDate, createNewUtcDate } from '@/shared/date-utils';

export const timestamp = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (request.path === '/timestamp') {
    return response.json({
      utc: createNewUtcDate().getTime(),
      duration: request.durationTime.format(),
      brl: createNewBrlDate().getTime(),
    });
  }
  return next();
};
