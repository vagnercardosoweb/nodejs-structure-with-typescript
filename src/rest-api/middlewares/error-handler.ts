import { NextFunction, Request, Response } from 'express';

import { Env, Logger, SlackAlert, Utils } from '@/shared';
import { HttpStatusCode } from '@/shared/enums';
import { parseErrorToObject } from '@/shared/errors';

export const errorHandler = (
  error: any,
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (response.headersSent) return next(error);

  error = parseErrorToObject(error);
  const requestUrl = request.originalUrl || request.url;

  const requestId = request.context?.requestId;
  if (!error.requestId) error.requestId = requestId;

  if (!request.logger) request.logger = Logger;
  if (error.logging) {
    request.logger.error('HTTP_REQUEST_ERROR', {
      path: `${request.method.toUpperCase()} ${requestUrl}`,
      routePath: request.route?.path,
      headers: request.headers,
      body: Utils.obfuscateValue(request.body),
      error,
    });
  }

  if (error.sendToSlack) {
    SlackAlert.send({
      color: 'error',
      sections: {
        message: error.original?.message ?? error.message,
        description: requestId ? error?.description : 'Unexpected error',
        requestId,
      },
      fields: {
        errorId: error.errorId,
        errorCode: error.code,
        requestMethod: request.method.toUpperCase(),
        requestPath: requestUrl,
        statusCode: error.statusCode,
      },
    }).catch(() => {});
  }

  if (request.translation) {
    if (error.statusCode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
      error.message = 'errors.internal_server_error';
    }

    error.message = request.translation.get(error.message, {
      errorId: error.errorId,
      ...error.metadata,
    });
  }

  return response.status(error.statusCode).json(
    Env.isLocal()
      ? error
      : {
          name: error.name,
          code: error.code,
          errorId: error.errorId,
          requestId: error.requestId,
          statusCode: error.statusCode,
          message: error.message,
        },
  );
};
