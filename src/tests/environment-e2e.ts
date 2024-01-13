import './default-env';

import path from 'node:path';

import { Logger } from '@/shared/logger';
import { Migrator, PgPool } from '@/shared/postgres';
import { setupPostgres, setupRedis } from '@/tests/containers';

export default async function globalVitestSetup() {
  const postgres = await setupPostgres();
  const redis = await setupRedis();

  const pgPool = PgPool.fromEnvironment(new Logger('MIGRATOR_TEST'));
  await new Migrator(pgPool, path.resolve(process.cwd(), 'migrations')).up();

  return async () => {
    await pgPool.close();
    await postgres.stop();
    await redis.stop();
  };
}
