import { NextFunction, Request, Response } from 'express';

import { RateLimiterError } from '@/errors';
import { Env, Redis } from '@/shared';

const DEFAULT_LIMIT = Env.get('RATE_LIMITER_LIMIT', 15);
const DEFAULT_EXPIRES_IN_SECONDS = Env.get(
  'RATE_LIMITER_EXPIRES_IN',
  60 * 60 * 24,
);

export const rateLimiterHandler =
  (
    key: string,
    expiresIn = DEFAULT_EXPIRES_IN_SECONDS,
    limit = DEFAULT_LIMIT,
  ) =>
  async (request: Request, _response: Response, next: NextFunction) => {
    if (Env.isLocal()) return next();
    const parsedKey = `rate-limiter:${request.ip}:${key}`;
    const clientRedis = Redis.getInstance();
    const hits = Number(await clientRedis.get<number>(parsedKey, 0));
    if (hits > limit) throw new RateLimiterError();
    await clientRedis.set(parsedKey, hits + 1, expiresIn);
    return next();
  };
