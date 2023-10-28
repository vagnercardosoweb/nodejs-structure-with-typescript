import path from 'node:path';

import { Request } from 'express';

import { setupEventManager } from '@/config/event-manager';
import { setupTranslation } from '@/config/translation';
import type {
  CacheInterface,
  EventManagerInterface,
  JwtInterface,
  LoggerInterface,
  PgPoolInterface,
  TranslationInterface,
} from '@/shared';
import {
  ContainerName,
  Env,
  Jwt,
  Logger,
  Migrator,
  PgPool,
  RedisCache,
} from '@/shared';

import { RestApi } from './rest-api';

export const setupDependencies = async (restApi: RestApi) => {
  const pgPool = await PgPool.fromEnvironment(
    Logger.withId('PG_POOL'),
  ).connect();
  restApi.set(ContainerName.PG_POOL, pgPool).beforeClose(() => pgPool.close());

  const cacheClient = await RedisCache.fromEnvironment(
    Logger.withId('REDIS'),
  ).connect();
  restApi
    .set(ContainerName.CACHE_CLIENT, cacheClient)
    .beforeClose(() => cacheClient.close());

  restApi.set(ContainerName.TRANSLATION, setupTranslation());
  restApi.set(ContainerName.EVENT_MANAGER, setupEventManager());
  restApi.set(ContainerName.JWT, new Jwt());

  if (Env.get('DB_EXECUTE_MIGRATION_ON_STARTED', true)) {
    await new Migrator(
      pgPool.withLogger(Logger.withId('DB_MIGRATOR')),
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
