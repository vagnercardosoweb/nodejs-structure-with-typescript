import process from 'node:process';

import { GenericContainer, Wait } from 'testcontainers';

const redisPort = 6379;
const postgresPort = 5432;

export const setupRedis = async () => {
  let genericContainer = new GenericContainer('bitnami/redis:latest')
    .withName('redis-test')
    .withExposedPorts(redisPort)
    .withWaitStrategy(Wait.forListeningPorts())
    .withEnvironment({
      ALLOW_EMPTY_PASSWORD: 'no',
      REDIS_PASSWORD: 'test',
    });
  if (process.env.TEST_REUSABLE_REDIS === 'true') {
    genericContainer = genericContainer.withReuse();
  }
  const container = await genericContainer.start();
  process.env.REDIS_HOST = container.getHost();
  process.env.REDIS_PORT = container.getMappedPort(redisPort).toString();
  process.env.REDIS_KEY_PREFIX = 'test';
  process.env.REDIS_PASSWORD = 'test';
  process.env.REDIS_DATABASE = '0';
  return container;
};

export const setupPostgres = async () => {
  let genericContainer = new GenericContainer('bitnami/postgresql:15')
    .withName('postgres-test')
    .withExposedPorts(postgresPort)
    .withWaitStrategy(Wait.forListeningPorts())
    .withEnvironment({
      POSTGRESQL_USERNAME: 'test',
      POSTGRESQL_PASSWORD: 'test',
      POSTGRESQL_DATABASE: 'test',
    });
  if (process.env.TEST_REUSABLE_POSTGRES === 'true') {
    genericContainer = genericContainer.withReuse();
  }
  const container = await genericContainer.start();
  process.env.DB_HOST = container.getHost();
  process.env.DB_PORT = container.getMappedPort(postgresPort).toString();
  process.env.DB_SCHEMA = 'public';
  process.env.DB_USERNAME = 'test';
  process.env.DB_PASSWORD = 'test';
  process.env.DB_NAME = 'test';
  process.env.DB_ENABLED_SSL = 'false';
  process.env.DB_LOGGING = 'false';
  process.env.DB_APP_NAME = 'test';
  return container;
};
