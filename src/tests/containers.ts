import { randomUUID } from 'node:crypto';
import process from 'node:process';

import { GenericContainer, Wait } from 'testcontainers';

const redisPort = 6379;
const postgresPort = 5432;

export const setupRedis = async () => {
  const container = await new GenericContainer('bitnami/redis:latest')
    .withName(`redis-test-${randomUUID()}`)
    .withExposedPorts(redisPort)
    .withWaitStrategy(
      Wait.forAll([
        Wait.forListeningPorts(),
        Wait.forLogMessage(/ready to accept connections/i),
      ]),
    )
    .withEnvironment({
      ALLOW_EMPTY_PASSWORD: 'no',
      REDIS_PASSWORD: 'test',
    })
    .start();
  process.env.REDIS_HOST = container.getHost();
  process.env.REDIS_PORT = container.getMappedPort(redisPort).toString();
  return container;
};

export const setupPostgres = async () => {
  const container = await new GenericContainer('bitnami/postgresql:15')
    .withName(`postgres-test-${randomUUID()}`)
    .withExposedPorts(postgresPort)
    .withWaitStrategy(
      Wait.forAll([
        Wait.forListeningPorts(),
        Wait.forLogMessage(/ready to accept connections/i),
      ]),
    )
    .withEnvironment({
      POSTGRESQL_USERNAME: 'test',
      POSTGRESQL_PASSWORD: 'test',
      POSTGRESQL_DATABASE: 'test',
    })
    .start();
  process.env.DB_HOST = container.getHost();
  process.env.DB_SCHEMA = randomUUID();
  process.env.DB_PORT = container.getMappedPort(postgresPort).toString();
  return container;
};
