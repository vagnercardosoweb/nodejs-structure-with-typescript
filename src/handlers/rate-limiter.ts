import { NextFunction, Request, Response } from 'express';

import { HttpStatusCode } from '@/enums';
import { parseErrorToObject, RateLimiterError } from '@/errors';
import { Env, Logger, Redis } from '@/shared';

const DEFAULT_LIMIT = Env.get('RATE_LIMITER_LIMIT', 50);
const DEFAULT_EXPIRES_IN_SECONDS = Env.get('RATE_LIMITER_EXPIRES_IN', 86400);

export const rateLimiterHandler =
  (
    key: string,
    expiresIn = DEFAULT_EXPIRES_IN_SECONDS,
    limit = DEFAULT_LIMIT,
  ) =>
  async (request: Request, response: Response, next: NextFunction) => {
    const parsedKey = `rate-limiter:${request.ip}:${key}`;
    const clientRedis = Redis.getInstance();

    response.on('finish', () => {
      if (
        response.statusCode >= HttpStatusCode.OK &&
        response.statusCode < HttpStatusCode.BAD_REQUEST
      ) {
        clientRedis
          .delete(parsedKey)
          .catch((error) =>
            Logger.error(
              `Error remove RATE LIMITE KEY: [${parsedKey}].`,
              parseErrorToObject(error),
            ),
          );
      }
    });

    const hits = Number(await clientRedis.get<number>(parsedKey, 0)) + 1;
    if (hits > limit) throw new RateLimiterError();
    await clientRedis.set(parsedKey, hits, expiresIn);
    return next();
  };
