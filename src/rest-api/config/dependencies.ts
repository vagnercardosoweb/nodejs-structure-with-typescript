import path from 'node:path';

import languagePtbr from '@/languages/pt-br';
import {
  ContainerName,
  Env,
  EventManager,
  Jwt,
  Logger,
  Migrator,
  PgPool,
  RedisCache,
  Translation,
} from '@/shared';

import { RestApi } from '../rest-api';
import { makeEvents } from './events';

export const makeDependencies = async (restApi: RestApi) => {
  const pgPool = await PgPool.fromEnvironment(
    Logger.withId('PG_POOL'),
  ).connect();

  restApi.set(ContainerName.PG_POOL, pgPool);
  restApi.beforeClose(() => pgPool.close());

  const cacheClient = await RedisCache.fromEnvironment().connect();
  restApi
    .set(ContainerName.CACHE_CLIENT, cacheClient)
    .beforeClose(() => cacheClient.close());

  const translation = new Translation().add('pt-br', languagePtbr);
  restApi.set(ContainerName.TRANSLATION, translation);

  const eventManager = new EventManager();
  restApi.set(ContainerName.EVENT_MANAGER, eventManager);
  makeEvents(eventManager);

  restApi.set(ContainerName.JWT, new Jwt());

  if (Env.get('DB_EXECUTE_MIGRATION_ON_STARTED', true)) {
    await new Migrator(
      pgPool.withLogger(Logger.withId('DB_MIGRATOR')),
      path.resolve('migrations'),
    ).up();
  }
};
