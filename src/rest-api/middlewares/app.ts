import { randomUUID } from 'node:crypto';

import { NextFunction, Request, Response } from 'express';

import { ContainerName, Logger, Translation } from '@/shared';
import { ContainerInterface } from '@/shared/container';

export const app =
  (container: ContainerInterface) =>
  (request: Request, response: Response, next: NextFunction) => {
    request.container = container;

    let language =
      request
        .acceptsLanguages()
        .map((language) => language.toLowerCase())
        .at(0) ?? '*';

    if (language === '*') language = 'pt-br';
    request.translation = container
      .get<Translation>(ContainerName.TRANSLATION)
      .withLocale(language);

    const requestId = randomUUID();
    request.context = {
      jwt: {} as Request['context']['jwt'],
      awsTraceId: request.header('x-amzn-trace-id'),
      awsRequestId: request.header('x-amzn-requestid'),
      requestId,
    };

    response.setHeader('X-Request-Id', requestId);
    request.logger = Logger.withId(requestId);

    return next();
  };
