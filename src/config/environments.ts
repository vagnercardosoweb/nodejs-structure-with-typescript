import os from 'node:os';
import process from 'node:process';

import { z } from 'zod';

import { NodeEnv } from '@/shared/enums';

const envAsEntries = Object.entries(process.env);
for (const [key, value] of envAsEntries) {
  if (value?.startsWith('${') && value.endsWith('}')) {
    process.env[key] = process.env[value.slice(2, -1)];
  }
}

const envFromSchema = z
  .object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.nativeEnum(NodeEnv),
    APP_KEY: z.string().min(32),
    APP_VERSION: z.string().default('1.0.0'),
    APP_NAME: z.string().default('app'),
    HEADER_NAME_REQUEST_ID: z.string().toLowerCase().default('x-request-id'),
    DEFAULT_LOCALE: z.string().default('pt-br'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
    SHOW_BODY_HTTP_REQUEST_LOGGER: z.coerce.boolean().default(false),
    SLACK_ALERT_ON_STARTED_OR_CLOSE_SERVER: z.coerce.boolean().default(true),
    ALERT_ERROR_SLACK_CACHE_MS: z.coerce.number().default(36e5),
    ALERT_ERROR_SLACK_CACHE_MAX: z.coerce.number().default(1000),
    RATE_LIMITER_SKIP_SUCCESS: z.coerce.boolean().default(true),
    RATE_LIMITER_EXPIRES_SECONDS: z.coerce.number().default(60),
    RATE_LIMITER_LIMIT: z.coerce.number().default(50),
    DB_HOST: z.string().min(4).default('localhost'),
    DB_PORT: z.coerce.number().default(5432),
    DB_NAME: z.string().min(4).default('development'),
    DB_USERNAME: z.string().min(4).default('root'),
    DB_PASSWORD: z.string().min(4).default('root'),
    DB_TIMEZONE: z.string().default('UTC'),
    DB_LOGGING: z.coerce.boolean().default(false),
    DB_CHARSET: z.string().default('utf8'),
    DB_ENABLED_SSL: z.coerce.boolean().default(false),
    DB_APP_NAME: z.string().default('app'),
    DB_MIGRATION_ON_STARTED: z.coerce.boolean().default(true),
    DB_POOL_IDLE: z.coerce.number().default(10000),
    DB_POOL_ACQUIRE: z.coerce.number().default(5000),
    DB_POOL_QUERY: z.coerce.number().default(3000),
    DB_POOL_MIN: z.coerce.number().default(0),
    DB_POOL_MAX: z.coerce.number().default(35),
    REDIS_HOST: z.string().min(4),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().default(''),
    REDIS_KEY_PREFIX: z.string().default('app:'),
    REDIS_DATABASE: z.coerce.number().default(0),
    SLACK_TOKEN: z.string().default(''),
    SLACK_ENABLED: z.coerce.boolean().default(false),
    SLACK_USERNAME: z.string().default('app'),
    SLACK_MEMBERS_ID: z.string().default(''),
    SLACK_CHANNEL: z.string().default('logs'),
    PAGINATION_DEFAULT_LIMIT: z.coerce.number().default(50),
    PAGINATION_DEFAULT_PAGE: z.coerce.number().default(1),
    JWT_PRIVATE_KEY: z.string().default(''),
    JWT_PUBLIC_KEY: z.string().default(''),
    REDACTED_KEYS: z.string().default(''),
    REDACTED_TEXT: z.string().default('[Redacted]'),
    TZ_BRL: z.string().default('America/Sao_Paulo'),
    TZ_UTC: z.string().default('UTC'),
    TZ: z.string().default('UTC'),
  })
  .parse(process.env);

export const environments = Object.freeze({
  PID: process.pid,
  HOSTNAME: os.hostname(),
  IS_STAGING: envFromSchema.NODE_ENV === NodeEnv.STAGING,
  IS_PRODUCTION: envFromSchema.NODE_ENV === NodeEnv.PRODUCTION,
  IS_TESTING: envFromSchema.NODE_ENV === NodeEnv.TEST,
  IS_LOCAL: envFromSchema.NODE_ENV === NodeEnv.LOCAL,
  ...envFromSchema,
});
