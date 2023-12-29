import path from 'node:path';

import { Request } from 'express';

import { constants } from '@/config/constants';
import { setupEventManager } from '@/config/event-manager';
import { setupTranslation } from '@/config/translation';
import { RestApi } from '@/rest-api/rest-api';
import { CacheInterface, RedisCache } from '@/shared/cache';
import { ContainerName } from '@/shared/container';
import { EventManagerInterface } from '@/shared/event-manager';
import { Jwt, JwtInterface } from '@/shared/jwt';
import { LoggerInterface } from '@/shared/logger';
import {
  PasswordHashBcrypt,
  PasswordHashInterface,
} from '@/shared/password-hash';
import { Migrator, PgPool, PgPoolInterface } from '@/shared/postgres';
import { TranslationInterface } from '@/shared/translation';

export const setupDependencies = async (
  restApi: RestApi,
  logger: LoggerInterface,
) => {
  restApi.set(ContainerName.LOGGER, logger);

  const pgPool = await PgPool.fromEnvironment(logger).connect();
  restApi.set(ContainerName.PG_POOL, pgPool).beforeClose(() => pgPool.close());

  const cacheClient = await RedisCache.fromEnvironment(logger).connect();
  restApi
    .set(ContainerName.CACHE_CLIENT, cacheClient)
    .beforeClose(() => cacheClient.close());

  restApi.set(
    ContainerName.PASSWORD_HASH,
    new PasswordHashBcrypt(constants.BCRYPT_SALT_ROUNDS),
  );

  restApi.set(ContainerName.TRANSLATION, setupTranslation(logger));
  restApi.set(ContainerName.EVENT_MANAGER, setupEventManager(logger));

  restApi.set(
    ContainerName.JWT,
    new Jwt(constants.JWT_PRIVATE_KEY, constants.JWT_PUBLIC_KEY),
  );

  if (constants.DB_MIGRATION_ON_STARTED) {
    await new Migrator(
      pgPool.withLogger(logger),
      path.resolve('migrations'),
    ).up();
  }
};

export const getLoggerFromRequest = (request: Request) =>
  request.container.get<LoggerInterface>(ContainerName.LOGGER);

export const getTranslationFromRequest = (request: Request) =>
  request.container.get<TranslationInterface>(ContainerName.TRANSLATION);

export const getEventManagerFromRequest = (request: Request) =>
  request.container.get<EventManagerInterface>(ContainerName.EVENT_MANAGER);

export const getJwtFromRequest = (request: Request) =>
  request.container.get<JwtInterface>(ContainerName.JWT);

export const getCacheClientFromRequest = (request: Request) =>
  request.container.get<CacheInterface>(ContainerName.CACHE_CLIENT);

export const getPgPoolFromRequest = (request: Request) =>
  request.container.get<PgPoolInterface>(ContainerName.PG_POOL);

export const getPasswordHashFromRequest = (request: Request) =>
  request.container.get<PasswordHashInterface>(ContainerName.PASSWORD_HASH);

export const getRequestIdFromRequest = (request: Request) =>
  request.container.get<string>(ContainerName.REQUEST_ID);
