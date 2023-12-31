import type { NextFunction, Request, Response } from 'express';

import { environments } from '@/config/environments';
import { getCacheClientFromRequest } from '@/rest-api/dependencies';
import { HttpStatusCode } from '@/shared/enums';
import { RateLimiterError } from '@/shared/errors';

export const rateLimiter =
  (
    key: string,
    expiresSeconds = environments.RATE_LIMITER_EXPIRES_SECONDS,
    limit = environments.RATE_LIMITER_LIMIT,
  ) =>
  async (request: Request, response: Response, next: NextFunction) => {
    const cacheClient = getCacheClientFromRequest(request);
    const cacheKey = `rate-limiter:${request.ip}:${key}`;

    const hits = Number(await cacheClient.get<number>(cacheKey, 0)) + 1;
    await cacheClient.set(cacheKey, hits, expiresSeconds);

    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(limit - hits, 0));
    response.setHeader('X-RateLimit-Used', Math.min(hits, limit));

    const resetTime = Date.now() + expiresSeconds * 1000;
    response.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

    if (environments.RATE_LIMITER_SKIP_SUCCESS) {
      response.on('finish', async () => {
        if (response.statusCode > HttpStatusCode.BAD_REQUEST) return;
        await cacheClient.set(cacheKey, hits - 1, expiresSeconds);
      });
    }

    if (hits > limit) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      response.setHeader('Retry-After', Math.max(0, retryAfter));
      throw new RateLimiterError({ replaceKeys: { ip: request.ip } });
    }

    return next();
  };
