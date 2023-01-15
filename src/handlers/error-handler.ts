import { NextFunction, Request, Response } from 'express';

import { HttpStatusCode } from '@/enums';
import { parseErrorToObject } from '@/errors';
import { Env, Logger, Util } from '@/shared';
import { Slack } from '@/shared/slack';
import { Translation } from '@/translations';

export const errorHandler = (
  error: any,
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (response.headersSent) return next(error);
  const errorObject = parseErrorToObject(error);
  response.statusCode = errorObject.statusCode;

  if (Env.isLocal()) return response.json(errorObject);

  const { requestId } = request.context;
  const originalPath = request.originalUrl || request.url;

  Logger.error('error-to-object', {
    path: originalPath,
    method: request.method,
    query: request.query,
    params: request.params,
    cookies: request.cookies,
    headers: request.headers,
    body: Util.obfuscateValueFromObject(request.body),
    context: { requestId },
    error: errorObject,
  });

  if (errorObject.sendToSlack) {
    Slack.sendMessage({
      color: 'error',
      sections: {
        message: errorObject.message,
        description: errorObject?.description,
      },
      fields: {
        errorId: errorObject.errorId,
        errorCode: errorObject.code,
        requestMethod: request.method.toUpperCase(),
        requestPath: originalPath,
        statusCode: errorObject.statusCode,
      },
    })
      .then(() => Logger.info('sent request error to slack success'))
      .catch(() => Logger.error('sent request error to slack failed'));
  }

  let errorMessage = errorObject.message;
  if (errorObject.statusCode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
    errorMessage = 'errors.internal_server_error';
  }

  return response.json({
    name: errorObject.name,
    code: errorObject.code,
    errorId: errorObject.errorId,
    statusCode: errorObject.statusCode,
    message: Translation.get(errorMessage, {
      errorId: errorObject.errorId,
      ...errorObject.metadata,
    }),
  });
};
