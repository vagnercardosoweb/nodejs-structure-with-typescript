import path from 'node:path';

import languagePtbr from '@/languages/pt-br';
import {
  ContainerName,
  Env,
  Migrator,
  PgPoolConnection,
  RedisCache,
  Translation,
} from '@/shared';

import { RestApi } from '../rest-api';

export const makeDependencies = async (api: RestApi) => {
  const dbPool = await PgPoolConnection.fromEnvironment().connect();
  api.set(ContainerName.DB_CONNECTION, dbPool).addOnClose(() => dbPool.close());

  const cache = await RedisCache.fromEnvironment().connect();
  api.set(ContainerName.CACHE_CLIENT, cache).addOnClose(() => cache.close());

  const translation = new Translation();
  translation.add('pt-br', languagePtbr);
  api.set(ContainerName.TRANSLATION, translation);

  if (Env.get('DB_EXECUTE_MIGRATION_ON_STARTED', true)) {
    await new Migrator(
      dbPool.withLoggerId('MIGRATOR'),
      path.resolve('migrations'),
    ).up();
  }
};
