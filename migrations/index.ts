import '../src/config/module-alias';

import path from 'node:path';

import { Env, Logger, Migrator, PgPool } from '@/shared';

const nodeEnv = Env.required('NODE_ENV');
if (nodeEnv === 'local') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: '.env.local' });
}

(async () => {
  const logger = Logger.withId('DB_MIGRATOR');
  const pgPool = PgPool.fromEnvironment(logger);
  const migrator = new Migrator(pgPool, path.resolve('migrations'));
  const prefix = process.argv?.[2]?.trim();
  try {
    if (prefix === 'up') {
      await migrator.up();
    } else {
      const limit = Number(process.argv?.[3]?.trim() ?? 1);
      await migrator.down(limit);
    }
  } finally {
    await pgPool.close();
  }
})();
