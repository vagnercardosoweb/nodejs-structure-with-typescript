import { NextFunction, Request, Response } from 'express';

import {
  getLoggerFromRequest,
  getTranslationFromRequest,
} from '@/config/dependencies';
import { environments } from '@/config/environments';
import { ContainerName } from '@/shared/container';
import { AppError, parseErrorToObject } from '@/shared/errors';
import { SlackAlert } from '@/shared/slack-alert';

const isShowAndAlertError = (_: Request) => {
  return true;
};

export const errorHandler = (
  error: AppError,
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (response.headersSent || !request?.requestId) return next(error);
  error = parseErrorToObject(error);

  const requestUrl = request.originalUrl || request.url;
  const requestMethod = request.method.toUpperCase();

  if (!error.requestId) error.requestId = request.requestId;
  error.replaceKeys.requestId = error.requestId;

  if (isShowAndAlertError(request)) {
    const serverId = request.container.get<string>(ContainerName.SERVER_ID);
    const logger = getLoggerFromRequest(request);

    if (error.logging) {
      logger.error('HTTP_REQUEST_ERROR', {
        ip: request.ip,
        path: `${requestMethod} ${requestUrl}`,
        method: requestMethod,
        routePath: request.route?.path,
        serverId,
        time: request.durationTime.format(),
        params: request.params,
        query: request.query,
        cookies: request.cookies,
        headers: request.headers,
        body: request.body,
        error,
      });
    }

    if (error.sendToSlack) {
      SlackAlert.send({
        color: 'error',
        sections: {
          'RequestId': request.requestId,
          'RequestInfo': `[${error.statusCode}] ${requestMethod} ${requestUrl}`,
          'ErrorCode / ErrorId': `${error.code} / ${error.errorId}`,
          'ErrorMessage': error.originalError?.message ?? error.message,
          'Description': request.requestId
            ? error?.description
            : 'Unexpected error',
        },
      }).catch((e) => {
        logger.error('SEND_ALERT_SLACK_ERROR', {
          slackError: parseErrorToObject(e),
          originalError: error,
        });
      });
    }
  }

  if (request.container.has(ContainerName.TRANSLATION)) {
    error.message = getTranslationFromRequest(request).get(
      error.message,
      error.replaceKeys,
    );
  }

  return response.status(error.statusCode).json(
    environments.IS_LOCAL
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
