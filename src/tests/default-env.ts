const isCI = process.env.CI === 'true';

process.env.TZ = 'UTC';
process.env.TEST_REUSABLE_REDIS = isCI ? 'false' : 'true';
process.env.TEST_REUSABLE_POSTGRES = isCI ? 'false' : 'true';
process.env.REDACTED_KEYS = 'password,password_confirm,testObject';
process.env.APP_KEY = 'test_7d1043473d55bfa90e8530d35801d4e381bc69f0';
