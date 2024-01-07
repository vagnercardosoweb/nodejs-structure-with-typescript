import os from 'node:os';
import process from 'node:process';

import { z } from 'zod';

import { NodeEnv } from '@/shared/enums';
import { isEmptyValue } from '@/shared/utils';

const transformToBooleanOrThrow = (value: string | undefined): boolean => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`The value "${value}" is not a boolean.`);
};

const env = z
  .object({
    PORT: z.coerce.number().default(3000),
    APP_KEY: z.string().min(32),
    APP_VERSION: z.string().default('1.0.0'),
    APP_NAME: z.string().default('app'),
    NODE_ENV: z.nativeEnum(NodeEnv),
    DEFAULT_LOCALE: z.string().default('pt-br'),
    HEADER_NAME_REQUEST_ID: z.string().toLowerCase().default('x-request-id'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
    SHOW_BODY_HTTP_REQUEST_LOGGER: z
      .string()
      .transform(transformToBooleanOrThrow)
      .default('false'),
    PAGINATION_DEFAULT_LIMIT: z.coerce.number().default(50),
    RATE_LIMITER_SKIP_SUCCESS: z
      .string()
      .transform(transformToBooleanOrThrow)
      .default('true'),
    RATE_LIMITER_EXPIRES_SECONDS: z.coerce.number().default(60),
    RATE_LIMITER_LIMIT: z.coerce.number().default(50),
    DB_HOST: z.string().min(4).default('localhost'),
    DB_PORT: z.coerce.number().default(5432),
    DB_NAME: z.string().min(4).default('development'),
    DB_USERNAME: z.string().min(4).default('root'),
    DB_PASSWORD: z.string().min(4).default('root'),
    DB_TIMEZONE: z.string().default('UTC'),
    DB_LOGGING: z
      .string()
      .transform(transformToBooleanOrThrow)
      .default('false'),
    DB_CHARSET: z.string().default('utf8'),
    DB_ENABLED_SSL: z
      .string()
      .transform(transformToBooleanOrThrow)
      .default('false'),
    DB_APP_NAME: z.string().default('app'),
    DB_MIGRATION_ON_STARTED: z
      .string()
      .transform(transformToBooleanOrThrow)
      .default('false'),
    DB_POOL_IDLE: z.coerce.number().default(10000),
    DB_POOL_ACQUIRE: z.coerce.number().default(5000),
    DB_POOL_QUERY: z.coerce.number().default(3000),
    DB_POOL_MIN: z.coerce.number().default(0),
    DB_POOL_MAX: z.coerce.number().default(35),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().default(''),
    REDIS_KEY_PREFIX: z.string().default('app:'),
    REDIS_DATABASE: z.coerce.number().default(0),
    SLACK_TOKEN: z.string().default(''),
    SLACK_ENABLED: z
      .string()
      .transform(transformToBooleanOrThrow)
      .default('false'),
    SLACK_USERNAME: z.string().default('app'),
    SLACK_ALERT_ON_STARTED_OR_CLOSE_SERVER: z
      .string()
      .transform(transformToBooleanOrThrow)
      .default('true'),
    SLACK_ALERT_ERROR_CACHE_MS: z.coerce.number().default(36e5),
    SLACK_ALERT_ERROR_CACHE_MAX: z.coerce.number().default(1000),
    SLACK_MEMBERS_ID: z.string().default(''),
    SLACK_CHANNEL: z.string().default('logs'),
    JWT_PRIVATE_KEY: z.string().default(''),
    JWT_PUBLIC_KEY: z.string().default(''),
    REDACTED_KEYS: z.string().default(''),
    REDACTED_TEXT: z.string().default('[Redacted]'),
    TZ_BRL: z.string().default('America/Sao_Paulo'),
    TZ_UTC: z.string().default('UTC'),
    TZ: z.string().default('UTC'),
  })
  .parse(process.env);

for (const key in env) {
  const value = env[key as keyof typeof env];
  if (typeof value !== 'string') continue;
  if (!(value.startsWith('${') && value.endsWith('}'))) continue;
  const extendedValue = env[value.slice(2, -1) as keyof typeof env] as never;
  if (isEmptyValue(extendedValue)) continue;
  env[key as keyof typeof env] = extendedValue;
}

export const environments = Object.freeze({
  PID: process.pid,
  HOSTNAME: os.hostname(),
  IS_STAGING: env.NODE_ENV === NodeEnv.STAGING,
  IS_PRODUCTION: env.NODE_ENV === NodeEnv.PRODUCTION,
  IS_TESTING: env.NODE_ENV === NodeEnv.TEST,
  IS_LOCAL: env.NODE_ENV === NodeEnv.LOCAL,
  ...env,
});
