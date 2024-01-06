import { randomUUID } from 'node:crypto';

import { NextFunction, Request, Response } from 'express';

import { environments } from '@/config/environments';
import { type CacheInterface } from '@/shared/cache';
import { ContainerName } from '@/shared/container';
import { Logger } from '@/shared/logger';
import { type PgPoolInterface } from '@/shared/postgres';
import { type TranslationInterface } from '@/shared/translation';
import { isUndefined } from '@/shared/utils';

const getAcceptLanguage = (request: Request) => {
  const language = request.acceptsLanguages().at(0) ?? '*';
  if (language === '*') return environments.DEFAULT_LOCALE;
  return language.trim().toLowerCase();
};

const getOrCreateRequestId = (request: Request) => {
  let requestId = request.header(environments.HEADER_NAME_REQUEST_ID);
  if (!requestId) requestId = randomUUID();
  request.requestId = requestId;
  request.container.set(ContainerName.REQUEST_ID, requestId);
  return requestId;
};

const extractTokenFromRequest = (request: Request) => {
  const { authorization = '' } = request.headers;
  let [, token] = authorization.split(' ');
  if (isUndefined(token)) token = '';
  request.authorizationToken = token.trim();
};

const extractAwsRequestId = (request: Request) => {
  request.awsRequestId = request.header('x-amzn-requestid') || '';
  request.awsTraceId = request.header('x-amzn-trace-id') || '';
};

export const app = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const requestId = getOrCreateRequestId(request);
  response.setHeader('x-request-id', requestId);

  const requestLogger = new Logger(requestId);
  request.container.set(ContainerName.LOGGER, requestLogger);

  const translation = request.container
    .get<TranslationInterface>(ContainerName.TRANSLATION)
    .withLocale(getAcceptLanguage(request));

  request.acceptLanguage = translation.getLocale();
  request.container.set(ContainerName.TRANSLATION, translation);

  request.container.set(
    ContainerName.CACHE_CLIENT,
    request.container
      .get<CacheInterface>(ContainerName.CACHE_CLIENT)
      .withLogger(requestLogger),
  );

  request.container.set(
    ContainerName.PG_POOL,
    request.container
      .get<PgPoolInterface>(ContainerName.PG_POOL)
      .withLogger(requestLogger),
  );

  extractTokenFromRequest(request);
  extractAwsRequestId(request);

  return next();
};
