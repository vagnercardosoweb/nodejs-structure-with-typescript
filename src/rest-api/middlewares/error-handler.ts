import crypto from 'node:crypto';

import { NextFunction, Request, Response } from 'express';

import { environments } from '@/config/environments';
import {
  getLoggerFromRequest,
  getTranslationFromRequest,
} from '@/rest-api/dependencies';
import { ContainerName } from '@/shared/container';
import { AppError, parseErrorToObject } from '@/shared/errors';
import { type LoggerInterface } from '@/shared/logger';
import { SlackAlert } from '@/shared/slack-alert';

const cacheAlertError = new Map<string, number>();
const isCachedErrorMessage = (errorMessage: string) => {
  if (cacheAlertError.size > environments.ALERT_ERROR_SLACK_CACHE_MAX) {
    cacheAlertError.clear();
  }
  const cachedMessage = crypto
    .createHash('sha1')
    .update(errorMessage)
    .digest('hex');
  const cachedTimestamp = cacheAlertError.get(cachedMessage);
  if (cachedTimestamp && cachedTimestamp > Date.now()) return true;
  cacheAlertError.set(
    cachedMessage,
    Date.now() + environments.ALERT_ERROR_SLACK_CACHE_MS,
  );
  return false;
};

const sendAlertError = ({
  error,
  requestUrl,
  requestMethod,
  request,
  logger,
}: SendAlertErrorInput) => {
  const errorMessage = (error.originalError?.message ?? error.message).trim();
  if (!error.sendToSlack || isCachedErrorMessage(errorMessage)) return;
  SlackAlert.send({
    color: 'error',
    sections: {
      'RequestId': request.requestId,
      'RequestInfo': `[${error.statusCode}] ${requestMethod} ${requestUrl}`,
      'ErrorCode / ErrorId': `${error.code} / ${error.errorId}`,
      'ErrorMessage': errorMessage,
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
};

const loggerError = ({
  error,
  request,
  logger,
  requestMethod,
  requestUrl,
}: SendAlertErrorInput) => {
  if (!error.logging) return;
  logger.error('HTTP_REQUEST_ERROR', {
    ip: request.ip,
    path: `${requestMethod} ${requestUrl}`,
    method: requestMethod,
    routePath: request.route?.path,
    serverId: request.container.get<string>(ContainerName.SERVER_ID),
    time: request.durationTime.format(),
    params: request.params,
    query: request.query,
    cookies: request.cookies,
    headers: request.headers,
    body: request.body,
    error,
  });
};

const translateMessage = (error: AppError, request: Request) => {
  if (!request.container.has(ContainerName.TRANSLATION)) return;
  const translation = getTranslationFromRequest(request);
  error.message = translation.get(error.message, error.replaceKeys);
};

export const errorHandler = (
  error: AppError,
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  if (response.headersSent || !request?.requestId) return next(error);
  error = parseErrorToObject(error);

  if (!error.requestId) error.requestId = request.requestId;
  error.replaceKeys.requestId = error.requestId;

  const requestUrl = request.originalUrl || request.url;
  const requestMethod = request.method.toUpperCase();
  const logger = getLoggerFromRequest(request);

  loggerError({ error, request, logger, requestUrl, requestMethod });
  sendAlertError({ error, request, logger, requestUrl, requestMethod });
  translateMessage(error, request);

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

type SendAlertErrorInput = {
  error: AppError;
  requestUrl: string;
  requestMethod: string;
  request: Request;
  logger: LoggerInterface;
};
