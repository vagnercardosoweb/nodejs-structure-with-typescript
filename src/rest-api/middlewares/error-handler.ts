import { NextFunction, Request, Response } from 'express';

import { Env, SlackAlert, Utils } from '@/shared';
import { HttpStatusCode } from '@/shared/enums';
import { parseErrorToObject } from '@/shared/errors';

export const errorHandler = (
  error: any,
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (response.headersSent) return next(error);
  const errorObject = parseErrorToObject(error);
  const { requestId } = request.context;

  if (!errorObject.requestId) errorObject.requestId = requestId;
  const requestUrl = request.originalUrl || request.url;

  if (errorObject.logging) {
    request.logger.error('HTTP_REQUEST_ERROR', {
      path: `${request.method.toUpperCase()} ${requestUrl}`,
      routePath: request.route?.path,
      headers: request.headers,
      body: Utils.obfuscateValue(request.body),
      error: errorObject,
    });
  }

  if (errorObject.sendToSlack) {
    SlackAlert.send({
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

  errorObject.message = request.translation.get(errorObject.message, {
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
