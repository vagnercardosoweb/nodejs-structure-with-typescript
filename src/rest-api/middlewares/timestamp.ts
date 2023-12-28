import { NextFunction, Request, Response } from 'express';

import { Common } from '@/shared/common';

export const timestamp = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (request.path === '/timestamp') {
    return response.json({
      utc: Common.createUtcDate().getTime(),
      duration: request.durationTime.format(),
      brl: Common.createBrlDate().getTime(),
    });
  }
  return next();
};
