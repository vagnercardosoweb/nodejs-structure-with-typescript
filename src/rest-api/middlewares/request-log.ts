import { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';

import { environments } from '@/config/environments';
import { getLoggerFromRequest } from '@/rest-api/dependencies';
import { ContainerName } from '@/shared/container';

const notLogPaths = ['/healthy', '/docs', '/favicon'];

export const requestLog = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const requestUrl = request.path;
  if (
    environments.IS_TESTING ||
    notLogPaths.some((path) => requestUrl.startsWith(path))
  ) {
    request.skipRequestLog = true;
    return next();
  }

  const path = `${request.method.toUpperCase()} ${requestUrl}`;
  const serverId = request.container.get<string>(ContainerName.SERVER_ID);
  const body = environments.SHOW_BODY_HTTP_REQUEST_LOGGER
    ? request.body
    : undefined;

  getLoggerFromRequest(request).info('HTTP_REQUEST_STARTED', {
    ip: request.ip,
    path,
    serverId,
    time: request.durationTime.format(),
    body,
  });

  return morgan((tokens, req: Request, res) => {
    const routePath = req.route?.path;
    const { statusCode } = res;

    return JSON.stringify({
      id: tokens.res(req, res, 'x-request-id'),
      level: statusCode < 200 || statusCode >= 400 ? 'ERROR' : 'INFO',
      pid: environments.PID,
      hostname: environments.HOSTNAME,
      timestamp: tokens.date(req, res, 'iso'),
      message: 'HTTP_REQUEST_COMPLETED',
      metadata: {
        ip: tokens['remote-addr'](req, res),
        path,
        routePath,
        serverId,
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
