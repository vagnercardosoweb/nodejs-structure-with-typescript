import { NextFunction, Request, Response } from 'express';

import {
  CacheInterface,
  ContainerName,
  Env,
  HttpStatusCode,
  Logger,
  parseErrorToObject,
  RateLimiterError,
} from '@/shared';

const DEFAULT_LIMIT = Env.get('RATE_LIMITER_LIMIT', 50);
const DEFAULT_EXPIRES_IN_SECONDS = Env.get('RATE_LIMITER_EXPIRES_IN', 86400);

export const rateLimiter =
  (
    key: string,
    expiresIn = DEFAULT_EXPIRES_IN_SECONDS,
    limit = DEFAULT_LIMIT,
  ) =>
  async (request: Request, response: Response, next: NextFunction) => {
    const cacheKey = `rate-limiter:${request.ip}:${key}`;
    const cacheClient = request.container.get<CacheInterface>(
      ContainerName.CACHE_CLIENT,
    );

    response.on('finish', () => {
      if (
        response.statusCode >= HttpStatusCode.OK &&
        response.statusCode < HttpStatusCode.BAD_REQUEST
      ) {
        cacheClient
          .remove(cacheKey)
          .catch((error) =>
            Logger.error(
              `Error remove RATE LIMITE KEY: [${cacheKey}].`,
              parseErrorToObject(error),
            ),
          );
      }
    });

    const hits = Number(await cacheClient.get<number>(cacheKey, 0)) + 1;
    if (hits > limit) throw new RateLimiterError();
    await cacheClient.set(cacheKey, hits, expiresIn);
    return next();
  };
