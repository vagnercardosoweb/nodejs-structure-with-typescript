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
    length: request.header('content-length'),
    referrer: request.headers.referer || request.headers.referrer,
    agent: request.header('user-agent'),
  });

  return morgan((tokens, req, res) => {
    return JSON.stringify({
      id: `REQ-${tokens.res(req, res, 'x-request-id')}`,
      level: 'INFO',
      message: 'completed',
      pid: `${PID}`,
      hostname: `${HOSTNAME}`,
      timestamp: `${tokens.date(req, res, 'iso')} ${TZ}`,
      metadata: {
        ip: tokens['remote-addr'](req, res),
        method: tokens.method(req, res),
        path: tokens.url(req, res),
        status: tokens.status(req, res),
        time: `${tokens['response-time'](req, res)} ms`,
        version: tokens['http-version'](req, res),
        length: tokens.res(req, res, 'content-length'),
        referrer: tokens.referrer(req, res),
        agent: tokens['user-agent'](req, res),
      },
    });
  })(request, response, next);
};
