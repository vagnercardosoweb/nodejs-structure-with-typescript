import { randomUUID } from 'node:crypto';

import { NextFunction, Request, Response } from 'express';

import { constants } from '@/config/constants';
import { CacheInterface } from '@/shared/cache';
import { ContainerName } from '@/shared/container';
import { Logger } from '@/shared/logger';
import { PgPoolInterface } from '@/shared/postgres';
import { TranslationInterface } from '@/shared/translation';

const getAcceptLanguage = (request: Request) => {
  const language = request.acceptsLanguages().at(0) ?? '*';
  if (language === '*') return constants.DEFAULT_LOCALE;
  return language.trim().toLowerCase();
};

export const app = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const requestId = randomUUID();
  request.container.set(ContainerName.REQUEST_ID, requestId);
  response.setHeader('X-Request-Id', requestId);

  const requestLogger = new Logger(requestId);
  request.container.set(ContainerName.LOGGER, requestLogger);

  const translation = request.container
    .get<TranslationInterface>(ContainerName.TRANSLATION)
    .withLocale(getAcceptLanguage(request));
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

  request.context = {
    jwt: {} as Request['context']['jwt'],
    awsTraceId: request.header('x-amzn-trace-id'),
    awsRequestId: request.header('x-amzn-requestid'),
    language: translation.getLocale(),
    requestId,
  };

  return next();
};
