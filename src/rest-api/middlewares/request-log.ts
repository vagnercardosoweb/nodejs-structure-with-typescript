import os from 'node:os';

import { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';

import { Env, Utils } from '@/shared';

const bypassPaths = ['/', '/favicon.ico'];

export const requestLog = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const requestUrl = request.originalUrl || request.url;
  if (Env.isTesting() || bypassPaths.includes(requestUrl)) {
    return next();
  }

  const path = `${request.method.toUpperCase()} ${requestUrl}`;
  const body = Env.get('SHOW_BODY_HTTP_REQUEST_LOGGER', false)
    ? Utils.obfuscateValue(request.body)
    : undefined;

  request.logger.info('HTTP_REQUEST_STARTED', { ip: request.ip, path });

  return morgan((tokens, req: Request, res) => {
    const routePath = req.route?.path;
    const { statusCode } = res;

    return JSON.stringify({
      id: tokens.res(req, res, 'x-request-id'),
      level: statusCode < 200 || statusCode >= 400 ? 'ERROR' : 'INFO',
      message: 'HTTP_REQUEST_COMPLETED',
      pid: `${process.pid}`,
      hostname: `${os.hostname()}`,
      timestamp: tokens.date(req, res, 'iso'),
      metadata: {
        ip: tokens['remote-addr'](req, res),
        path,
        routePath,
        length: tokens.res(req, res, 'content-length'),
        version: tokens['http-version'](req, res),
        referrer: tokens.referrer(req, res),
        status: tokens.status(req, res),
        agent: tokens['user-agent'](req, res),
        time: `${res.getHeader('X-Response-Time')}`,
        body,
      },
    });
  })(request, response, next);
};
