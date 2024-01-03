import process from 'node:process';

process.env.APP_KEY = 'test_7d1043473d55bfa90e8530d35801d4e381bc69f0';
process.env.REDACTED_KEYS = 'password,password_confirm,testObject';
process.env.REDIS_KEY_PREFIX = 'test';
process.env.REDIS_PASSWORD = 'test';
process.env.REDIS_DATABASE = '0';
process.env.DB_USERNAME = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test';
process.env.DB_MIGRATION_ON_STARTED = 'false';
process.env.DB_ENABLED_SSL = 'false';
process.env.DB_LOGGING = 'false';
process.env.DB_APP_NAME = 'test';
