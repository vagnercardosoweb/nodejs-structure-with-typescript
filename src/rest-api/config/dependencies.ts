import path from 'node:path';

import languagePtbr from '@/languages/pt-br';
import {
  ContainerName,
  Env,
  Jwt,
  Migrator,
  PgPool,
  RedisCache,
  Translation,
} from '@/shared';

import { RestApi } from '../rest-api';

export const makeDependencies = async (api: RestApi) => {
  const pgPool = await PgPool.fromEnvironment().connect();
  api.set(ContainerName.PG_POOL, pgPool).addOnClose(() => pgPool.close());

  const cache = await RedisCache.fromEnvironment().connect();
  api.set(ContainerName.CACHE_CLIENT, cache).addOnClose(() => cache.close());

  const translation = new Translation().add('pt-br', languagePtbr);

  api.set(ContainerName.TRANSLATION, translation);
  api.set(ContainerName.JWT, new Jwt());

  if (Env.get('DB_EXECUTE_MIGRATION_ON_STARTED', true)) {
    await new Migrator(
      pgPool.withLoggerId('MIGRATOR'),
      path.resolve('migrations'),
    ).up();
  }
};
