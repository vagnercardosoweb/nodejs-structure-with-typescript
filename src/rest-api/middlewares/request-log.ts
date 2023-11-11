import { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';

import { HOSTNAME, PID } from '@/config/constants';
import { Env } from '@/shared';

const bypassPaths = ['/docs', '/favicon.ico'];

export const requestLog = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const requestUrl = request.path;
  if (
    Env.isTesting() ||
    requestUrl === '/' ||
    bypassPaths.some((path) => requestUrl.startsWith(path))
  ) {
    return next();
  }

  const path = `${request.method.toUpperCase()} ${requestUrl}`;
  const body = Env.get('SHOW_BODY_HTTP_REQUEST_LOGGER', false)
    ? request.body
    : undefined;

  request.logger.info('HTTP_REQUEST_STARTED', {
    ip: request.ip,
    path,
    body,
  });

  return morgan((tokens, req: Request, res) => {
    const routePath = req.route?.path;
    const { statusCode } = res;

    return JSON.stringify({
      id: tokens.res(req, res, 'x-request-id'),
      level: statusCode < 200 || statusCode >= 400 ? 'ERROR' : 'INFO',
      pid: PID,
      hostname: HOSTNAME,
      timestamp: tokens.date(req, res, 'iso'),
      message: 'HTTP_REQUEST_COMPLETED',
      metadata: {
        ip: tokens['remote-addr'](req, res),
        path,
        routePath,
        length: tokens.res(req, res, 'content-length'),
        version: tokens['http-version'](req, res),
        referrer: tokens.referrer(req, res),
        status: tokens.status(req, res),
        agent: tokens['user-agent'](req, res),
        query: request.query,
        time: `${tokens['response-time'](req, res)}ms`,
      },
    });
  })(request, response, next);
};
