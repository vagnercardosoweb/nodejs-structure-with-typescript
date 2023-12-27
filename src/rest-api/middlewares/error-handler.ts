import { NextFunction, Request, Response } from 'express';

import { getTranslationFromRequest } from '@/rest-api/dependencies';
import { AppError, ContainerName, Env, Logger, SlackAlert } from '@/shared';
import { parseErrorToObject } from '@/shared/errors';

export const errorHandler = (
  error: AppError,
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
  error.replaceKeys.requestId = error.requestId;

  if (!request.logger) request.logger = Logger.withId(requestId);
  if (error.logging) {
    request.logger.error('HTTP_REQUEST_ERROR', {
      ip: request.ip,
      path: `${requestMethod} ${requestUrl}`,
      routePath: request.route?.path,
      time: request.durationTime.format(),
      headers: request.headers,
      body: request.body,
      error,
    });
  }

  if (error.sendToSlack) {
    SlackAlert.send({
      color: 'error',
      sections: {
        'RequestId': requestId,
        'RequestInfo': `[${error.statusCode}] ${requestMethod} ${requestUrl}`,
        'ErrorCode / ErrorId': `${error.code} / ${error.errorId}`,
        'ErrorMessage': error.originalError?.message ?? error.message,
        'Description': requestId ? error?.description : 'Unexpected error',
      },
    }).catch((e) => {
      request.logger.error('SEND_ALERT_SLACK_ERROR', {
        slackError: parseErrorToObject(e),
        originalError: error,
      });
    });
  }

  if (request.container.has(ContainerName.TRANSLATION)) {
    error.message = getTranslationFromRequest(request).get(
      error.message,
      error.replaceKeys,
    );
  }

  return response.status(error.statusCode).json(
    Env.isLocal()
      ? error
      : {
          name: error.name,
          message: error.message,
          statusCode: error.statusCode,
          requestId: error.requestId,
          errorId: error.errorId,
          code: error.code,
        },
  );
};
