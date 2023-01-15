import { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';

import { HOSTNAME, IS_TESTING, PID, TZ } from '@/config/constants';

export const requestLogHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (IS_TESTING) return next();

  request.logger.info('started', {
    ip: request.ip,
    method: request.method,
    path: request.originalUrl || request.url,
    version: `${request.httpVersionMajor}.${request.httpVersionMinor}`,
    referrer: request.headers.referer || request.headers.referrer,
    agent: request.header('user-agent'),
  });

  return morgan((tokens, req, res) => {
    const { statusCode } = res;
    return JSON.stringify({
      id: `REQ:${tokens.res(req, res, 'x-request-id')}`,
      level: statusCode < 200 || statusCode >= 400 ? 'ERROR' : 'INFO',
      message: 'completed',
      pid: `${PID}`,
      hostname: `${HOSTNAME}`,
      timestamp: `${tokens.date(req, res, 'iso')} ${TZ}`,
      metadata: {
        time: `${tokens['response-time'](req, res)} ms`,
        status: tokens.status(req, res),
        length: tokens.res(req, res, 'content-length'),
      },
    });
  })(request, response, next);
};
