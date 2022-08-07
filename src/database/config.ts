import { SequelizeOptions } from 'sequelize-typescript';

import { NodeEnv } from '@/enums';
import { Env, Logger } from '@/utils';

import * as models from './models';

export class Config {
  public static getTimezone(): string {
    return Env.get('DB_TIMEZONE', 'UTC');
  }

  public static getCharset() {
    return Env.get('DB_ENCODING', 'utf8');
  }

  public static transformSql(sql: string): string {
    return sql.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
  }

  public static create(options?: SequelizeOptions): SequelizeOptions {
    const charset = this.getCharset();

    const mergeConfig = {
      models: Object.values(models),
      timezone: this.getTimezone(),
      encoding: charset,
      benchmark: Env.get('DB_BENCHMARK', false),
      dialect: Env.get('DB_TYPE', 'postgres'),
      host: Env.required('DB_HOST'),
      port: Number(Env.required('DB_PORT')),
      username: Env.required('DB_USERNAME'),
      password: Env.required('DB_PASSWORD'),
      database: Env.required('DB_NAME'),
      migrationStorageTableName: Env.get('DB_MIGRATION_NAME', 'migrations'),
      quoteIdentifiers: false,
      schema: Env.get('DB_SCHEMA', 'public'),
      logging: Env.get('DB_LOGGING', false)
        ? (sql) => Logger.info(this.transformSql(sql), { id: 'SEQUELIZE' })
        : false,
      pool: {
        max: Env.get('DB_POOL_MAX'),
        min: Env.get('DB_POOL_MIN'),
        acquire: Env.get('DB_POOL_ACQUIRE'),
        idle: Env.get('DB_POOL_IDLE'),
        evict: Env.get('DB_POOL_EVICT'),
      },
      define: {
        charset,
        underscored: true,
        paranoid: Env.get('DB_SOFT_DELETE', true),
        timestamps: Env.get('DB_TIMESTAMPS', true),
        collate: Env.get('DB_COLLATE', 'utf8_general_ci'),
        createdAt: Env.get('DB_CREATED_AT_NAME', 'created_at'),
        updatedAt: Env.get('DB_UPDATED_AT_NAME', 'updated_at'),
        deletedAt: Env.get('DB_DELETED_AT_NAME', 'deleted_at'),
      },
      ...options,
    } as SequelizeOptions;

    if (Env.get('NODE_ENV') === NodeEnv.TEST) {
      mergeConfig.logging = false;
    }

    return mergeConfig;
  }
}
