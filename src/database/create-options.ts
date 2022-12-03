import { SequelizeOptions } from 'sequelize-typescript';

import * as models from '@/database/models';
import { NodeEnv } from '@/enums';
import { Env } from '@/shared';

export class CreateOptions {
  public static timezone(): string {
    return Env.get('DB_TIMEZONE', 'UTC');
  }

  public static charset() {
    return Env.get('DB_ENCODING', 'utf8');
  }

  public static create(): SequelizeOptions {
    const charset = this.charset();
    const options = {
      models: Object.values(models),
      timezone: this.timezone(),
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
      minifyAliases: true,
      schema: Env.get('DB_SCHEMA', 'public'),
      keepDefaultTimezone: true,
      logging: Env.get('DB_LOGGING', false),
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
    } as SequelizeOptions;
    if (Env.get('NODE_ENV') === NodeEnv.TEST) {
      options.logging = false;
    }
    return options;
  }
}
