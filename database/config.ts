const charset = process.env.DB_ENCODING || 'utf8';
const timezone = process.env.DB_TIMEZONE || 'UTC';
const collate = process.env.DB_COLLATE || 'utf8_general_ci';
const enabledSsl = process.env.DB_ENABLED_SSL === 'true';
const migrationStorageTableName =
  process.env.DB_MIGRATION_TABLE_NAME || 'migrations';

let options: any = {
  // eslint-disable-next-line no-console
  logging: console.log,
  dialect: process.env.DB_TYPE || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'development',
  encoding: charset,
  timezone,

  migrationStorageTableName,

  define: {
    charset,
    collate,
  },
};

if (enabledSsl) {
  options = {
    ...options,
    ssl: true,
    dialectOptions: {
      ...options.dialectOptions,
      ssl: {
        rejectUnauthorized: false,
        require: true,
      },
    },
  };
}

module.exports = options;
