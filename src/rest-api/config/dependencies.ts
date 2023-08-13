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

export const makeDependencies = async (api: RestApi) => {
  const pgPool = await PgPool.fromEnvironment(
    Logger.withId('PG_POOL'),
  ).connect();
  api.set(ContainerName.PG_POOL, pgPool).addOnClose(() => pgPool.close());

  const cacheClient = await RedisCache.fromEnvironment().connect();
  api
    .set(ContainerName.CACHE_CLIENT, cacheClient)
    .addOnClose(() => cacheClient.close());

  const translation = new Translation().add('pt-br', languagePtbr);
  api.set(ContainerName.TRANSLATION, translation);

  const eventManager = new EventManager();
  api.set(ContainerName.EVENT_MANAGER, eventManager);
  makeEvents(eventManager);

  api.set(ContainerName.JWT, new Jwt());

  if (Env.get('DB_EXECUTE_MIGRATION_ON_STARTED', true)) {
    await new Migrator(
      pgPool.withLoggerId('MIGRATOR'),
      path.resolve('migrations'),
    ).up();
  }
};
