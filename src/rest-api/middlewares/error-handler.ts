import { NextFunction, Request, Response } from 'express';

import { constants } from '@/config/constants';
import {
  getLoggerFromRequest,
  getTranslationFromRequest,
} from '@/rest-api/dependencies';
import { ContainerName } from '@/shared/container';
import { AppError, parseErrorToObject } from '@/shared/errors';
import { SlackAlert } from '@/shared/slack-alert';

export const errorHandler = (
  error: AppError,
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (response.headersSent || !request.context?.requestId) return next(error);
  error = parseErrorToObject(error);

  const requestUrl = request.originalUrl || request.url;
  const requestMethod = request.method.toUpperCase();

  const requestId = request.context.requestId;
  if (!error.requestId) error.requestId = requestId;
  error.replaceKeys.requestId = error.requestId;

  const serverId = request.container.get<string>(ContainerName.SERVER_ID);
  const logger = getLoggerFromRequest(request);

  if (error.logging) {
    logger.error('HTTP_REQUEST_ERROR', {
      ip: request.ip,
      path: `${requestMethod} ${requestUrl}`,
      routePath: request.route?.path,
      serverId,
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
        'ServerId': serverId,
        'RequestId': requestId,
        'RequestInfo': `[${error.statusCode}] ${requestMethod} ${requestUrl}`,
        'ErrorCode / ErrorId': `${error.code} / ${error.errorId}`,
        'ErrorMessage': error.originalError?.message ?? error.message,
        'Description': requestId ? error?.description : 'Unexpected error',
      },
    }).catch((e) => {
      logger.error('SEND_ALERT_SLACK_ERROR', {
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
    constants.IS_LOCAL
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
