import path from 'node:path';

import languagePtbr from '@/languages/pt-br';
import { RestApi } from '@/rest-api/rest-api';
import {
  ContainerName,
  Env,
  Migrator,
  PgPoolConnection,
  RedisCache,
  Translation,
} from '@/shared';

export const createDependencies = async (app: RestApi) => {
  const dbPool = await PgPoolConnection.fromEnvironment().connect();
  app.set(ContainerName.DB_CONNECTION, dbPool).addOnClose(() => dbPool.close());

  const cache = await RedisCache.fromEnvironment().connect();
  app.set(ContainerName.CACHE_CLIENT, cache).addOnClose(() => cache.close());

  if (Env.get('DB_EXECUTE_MIGRATION_ON_STARTED', true)) {
    await new Migrator(
      dbPool.withLoggerId('MIGRATOR'),
      path.resolve('migrations'),
    ).up();
  }

  const translation = new Translation();
  translation.add('pt-br', languagePtbr);
  app.set(ContainerName.TRANSLATION, translation);
};
