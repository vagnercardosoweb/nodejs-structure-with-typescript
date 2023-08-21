import { NextFunction, Request, Response } from 'express';

import { Env, Logger, SlackAlert } from '@/shared';
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
  const requestMethod = request.method.toUpperCase();

  const requestId = request.context?.requestId;
  if (!error.requestId) error.requestId = requestId;

  if (!request.logger) request.logger = Logger.withId(requestId);
  if (error.logging) {
    request.logger.error('HTTP_REQUEST_ERROR', {
      path: `${requestMethod} ${requestUrl}`,
      routePath: request.route?.path,
      headers: request.headers,
      body: request.body,
      error,
    });
  }

  if (error.sendToSlack) {
    SlackAlert.send({
      color: 'error',
      sections: {
        'Request': `[${error.statusCode}] ${requestMethod} ${requestUrl}`,
        'ErrorId / ErrorCode': `${error.errorId} / ${error.code}`,
        'RequestId': requestId,
        'Description': requestId ? error?.description : 'Unexpected error',
        'Message': error.originalError?.message ?? error.message,
      },
    }).catch((e) => {
      request.logger.error('SEND_ALERT_SLACK_ERROR', {
        slackError: parseErrorToObject(e),
        originalError: error,
      });
    });
  }

  if (request.translation) {
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
