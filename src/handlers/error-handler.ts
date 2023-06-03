import { NextFunction, Request, Response } from 'express';

import { HttpStatusCode } from '@/enums';
import { parseErrorToObject } from '@/errors';
import { Env, Util } from '@/shared';
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
  const { requestId } = request.context;
  const requestUrl = request.originalUrl || request.url;
  if (!errorObject.requestId) errorObject.requestId = requestId;

  if (errorObject.logging) {
    request.logger.error('HTTP_REQUEST_ERROR', {
      path: requestUrl,
      method: request.method,
      query: request.query,
      params: request.params,
      cookies: request.cookies,
      headers: request.headers,
      body: Util.obfuscateValue(request.body),
      context: {},
      error: errorObject,
    });
  }

  if (errorObject.sendToSlack) {
    Slack.sendMessage({
      color: 'error',
      sections: {
        message: errorObject.message,
        description: errorObject?.description,
        requestId,
      },
      fields: {
        errorId: errorObject.errorId,
        errorCode: errorObject.code,
        requestMethod: request.method.toUpperCase(),
        requestPath: requestUrl,
        statusCode: errorObject.statusCode,
      },
    })
      .then(() => request.logger.info('sent request error to slack success'))
      .catch(() => request.logger.error('sent request error to slack failed'));
  }

  if (errorObject.statusCode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
    errorObject.message = 'errors.internal_server_error';
  }

  errorObject.message = Translation.get(errorObject.message, {
    errorId: errorObject.errorId,
    ...errorObject.metadata,
  });

  return response.status(errorObject.statusCode).json(
    Env.isLocal()
      ? errorObject
      : {
          name: errorObject.name,
          code: errorObject.code,
          errorId: errorObject.errorId,
          requestId: errorObject.requestId,
          statusCode: errorObject.statusCode,
          message: errorObject.message,
        },
  );
};
