import { randomUUID } from 'node:crypto';

import { NextFunction, Request, Response } from 'express';

import { DEFAULT_LOCALE } from '@/config/constants';
import { CacheInterface } from '@/shared/cache';
import { ContainerInterface, ContainerName } from '@/shared/container';
import { Logger } from '@/shared/logger';
import { PgPoolInterface } from '@/shared/postgres';
import { TranslationInterface } from '@/shared/translation';

const getAcceptLanguage = (request: Request) => {
  const language = request.acceptsLanguages().at(0) ?? '*';
  if (language === '*') return DEFAULT_LOCALE;
  return language.trim().toLowerCase();
};

export const app =
  (container: ContainerInterface) =>
  (request: Request, response: Response, next: NextFunction) => {
    request.container = container.clone();

    const requestId = randomUUID();
    request.container.set(ContainerName.REQUEST_ID, requestId);
    response.setHeader('X-Request-Id', requestId);

    request.logger = Logger.withId(requestId);
    request.container.set(ContainerName.LOGGER, request.logger);

    request.context = {
      jwt: {} as Request['context']['jwt'],
      awsTraceId: request.header('x-amzn-trace-id'),
      awsRequestId: request.header('x-amzn-requestid'),
      language: getAcceptLanguage(request),
      requestId,
    };

    const translation = container
      .get<TranslationInterface>(ContainerName.TRANSLATION)
      .withLocale(request.context.language);
    request.container.set(ContainerName.TRANSLATION, translation);
    request.context.language = translation.getLocale();

    request.container.set(
      ContainerName.CACHE_CLIENT,
      container
        .get<CacheInterface>(ContainerName.CACHE_CLIENT)
        .withLogger(request.logger),
    );

    request.container.set(
      ContainerName.PG_POOL,
      request.container
        .get<PgPoolInterface>(ContainerName.PG_POOL)
        .withLogger(request.logger),
    );

    return next();
  };
