import { randomUUID } from 'node:crypto';

import { NextFunction, Request, Response } from 'express';

import { ContainerName, Logger, PgPoolInterface, Translation } from '@/shared';
import { ContainerInterface } from '@/shared/container';

export const app =
  (container: ContainerInterface) =>
  (request: Request, response: Response, next: NextFunction) => {
    request.container = container.clone();
    request.eventManager = container.get(ContainerName.EVENT_MANAGER);

    const requestId = randomUUID();
    request.container.set(ContainerName.REQUEST_ID, requestId);
    response.setHeader('X-Request-Id', requestId);

    request.logger = Logger.withId(requestId);
    request.container.set(ContainerName.LOGGER, request.logger);

    let language =
      request
        .acceptsLanguages()
        .map((language) => language.toLowerCase())
        .at(0) ?? '*';
    if (language === '*') language = 'pt-br';

    request.context = {
      jwt: {} as Request['context']['jwt'],
      awsTraceId: request.header('x-amzn-trace-id'),
      awsRequestId: request.header('x-amzn-requestid'),
      requestId,
      language,
    };

    request.translation = container
      .get<Translation>(ContainerName.TRANSLATION)
      .withLocale(language);

    request.container.set(ContainerName.TRANSLATION, request.translation);

    request.container.set(
      ContainerName.PG_POOL,
      request.container
        .get<PgPoolInterface>(ContainerName.PG_POOL)
        .withLoggerId(requestId),
    );

    return next();
  };
