import path from 'node:path';

import { Request } from 'express';

import { environments } from '@/config/environments';
import { setupEventManager } from '@/config/event-manager';
import { setupTranslation } from '@/config/translation';
import { RestApi } from '@/rest-api/rest-api';
import { RedisCache, type CacheInterface } from '@/shared/cache';
import { ContainerName } from '@/shared/container';
import { type EventManagerInterface } from '@/shared/event-manager';
import { Jwt, type JwtInterface } from '@/shared/jwt';
import { type LoggerInterface } from '@/shared/logger';
import {
  PasswordHashBcrypt,
  type PasswordHashInterface,
} from '@/shared/password-hash';
import { Migrator, PgPool, type PgPoolInterface } from '@/shared/postgres';
import { type TranslationInterface } from '@/shared/translation';

export const setupDependencies = async (restApi: RestApi) => {
  restApi.set(ContainerName.LOGGER, restApi.getLogger());

  const pgPool = await PgPool.fromEnvironment(restApi.getLogger()).connect();
  restApi.set(ContainerName.PG_POOL, pgPool).beforeClose(() => pgPool.close());

  const cacheClient = await RedisCache.fromEnvironment(
    restApi.getLogger(),
  ).connect();
  restApi
    .set(ContainerName.CACHE_CLIENT, cacheClient)
    .beforeClose(() => cacheClient.close());

  restApi.set(
    ContainerName.PASSWORD_HASH,
    new PasswordHashBcrypt(environments.BCRYPT_SALT_ROUNDS),
  );

  restApi.set(ContainerName.TRANSLATION, setupTranslation(restApi.getLogger()));
  restApi.set(
    ContainerName.EVENT_MANAGER,
    setupEventManager(restApi.getLogger()),
  );

  restApi.set(
    ContainerName.JWT,
    new Jwt(environments.JWT_PRIVATE_KEY, environments.JWT_PUBLIC_KEY),
  );

  if (environments.DB_MIGRATION_ON_STARTED) {
    await new Migrator(
      pgPool.withLogger(restApi.getLogger()),
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
