import console from 'node:console';
import os from 'node:os';
import process from 'node:process';

import { z } from 'zod';

import { NodeEnv } from '@/shared/enums';

const envSchema = z
  .object({
    PORT: z.coerce.number().default(3000),
    APP_KEY: z.string().min(32),
    API_KEY: z.string().min(32),
    NODE_ENV: z.nativeEnum(NodeEnv),
    APPLICATION_NAME: z.string().default('app'),
    DEFAULT_LOCALE: z.string().default('pt-br'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
    SHOW_BODY_HTTP_REQUEST_LOGGER: z.coerce.boolean().default(false),
    SLACK_ALERT_ON_STARTED_OR_CLOSE_SERVER: z.coerce.boolean().default(true),
    RATE_LIMITER_SKIP_SUCCESS: z.coerce.boolean().default(true),
    RATE_LIMITER_EXPIRES_SECONDS: z.coerce.number().default(60),
    RATE_LIMITER_LIMIT: z.coerce.number().default(50),
    DB_HOST: z.string().min(4),
    DB_PORT: z.coerce.number().default(5432),
    DB_NAME: z.string().min(4),
    DB_USERNAME: z.string().min(4),
    DB_PASSWORD: z.string().min(4),
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
    JWT_PRIVATE_KEY: z.string().min(1),
    JWT_PUBLIC_KEY: z.string().min(1),
    REDACTED_KEYS: z.string().default(''),
    REDACTED_TEXT: z.string().default('[Redacted]'),
    TZ_BRL: z.string().default('America/Sao_Paulo'),
    TZ_UTC: z.string().default('UTC'),
    TZ: z.string().default('UTC'),
  })
  .safeParse(process.env);

if (!envSchema.success) {
  console.error('SCHEMA_ERROR', envSchema.error.flatten());
  throw new Error('The environment variables are invalid');
}

export const constants = Object.freeze({
  PID: process.pid,
  HOSTNAME: os.hostname(),
  IS_LOCAL: envSchema.data.NODE_ENV === NodeEnv.LOCAL,
  IS_PRODUCTION: envSchema.data.NODE_ENV === NodeEnv.PRODUCTION,
  IS_STAGING: envSchema.data.NODE_ENV === NodeEnv.STAGING,
  IS_TESTING: envSchema.data.NODE_ENV === NodeEnv.TEST,
  ...envSchema.data,
});
