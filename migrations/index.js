require('../dist/config/module-alias');

const path = require('node:path');
const { Migrator, PgPool } = require('@/shared/postgres');
const { Logger } = require('@/shared/logger');

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
