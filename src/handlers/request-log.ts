import { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';

import { HOSTNAME, IS_TESTING, PID, TZ } from '@/config/constants';
import { Env } from '@/shared';

export const requestLogHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const path = request.originalUrl || request.url;
  if (IS_TESTING || path === '/') return next();

  request.logger.info('HTTP_REQUEST_STARTED', {
    ip: request.ip,
    method: request.method,
    path,
    version: `${request.httpVersionMajor}.${request.httpVersionMinor}`,
    referrer: request.headers.referer || request.headers.referrer,
    agent: request.header('user-agent'),
    ...(Env.get('SHOW_BODY_HTTP_REQUEST_LOGGER') ? { body: request.body } : {}),
  });

  return morgan((tokens, req, res) => {
    const path = tokens.url(req, res);
    const routePath = (req as Request).route?.path ?? path;
    const { statusCode } = res;

    return JSON.stringify({
      id: tokens.res(req, res, 'x-request-id'),
      level: statusCode < 200 || statusCode >= 400 ? 'ERROR' : 'INFO',
      message: 'HTTP_REQUEST_COMPLETED',
      pid: `${PID}`,
      hostname: `${HOSTNAME}`,
      timestamp: `${tokens.date(req, res, 'iso')} ${TZ}`,
      metadata: {
        ip: tokens['remote-addr'](req, res),
        method: tokens.method(req, res),
        path,
        route_path: routePath,
        status: tokens.status(req, res),
        time: `${res.getHeader('X-Response-Time')}`,
        version: tokens['http-version'](req, res),
        length: tokens.res(req, res, 'content-length'),
        referrer: tokens.referrer(req, res),
        agent: tokens['user-agent'](req, res),
      },
    });
  })(request, response, next);
};
