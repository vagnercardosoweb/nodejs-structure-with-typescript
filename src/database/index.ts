import 'reflect-metadata';

import { Sequelize } from 'sequelize-typescript';

import { CreateOptions } from '@/database/create-options';
import { Transaction } from '@/database/transaction';
import { BindOrReplacements } from '@/database/types';
import { InternalServerError } from '@/errors';
import { Env, Logger, Util } from '@/shared';

export class Database {
  private logger: typeof Logger;
  private static instance: Database | null = null;
  private sequelize: Sequelize;
  private connected = false;

  private constructor() {
    this.logger = Logger.newInstance('DATABASE');
  }

  public static getInstance(): Database {
    if (this.instance === null) this.instance = new Database();
    return this.instance;
  }

  public getSequelize(): Sequelize {
    return this.sequelize;
  }

  public async query<TResult = any>(
    sql: string,
    bind?: BindOrReplacements,
  ): Promise<TResult[]> {
    if (!this.connected) {
      this.logger.error('database is not connected to perform queries');
      throw new InternalServerError();
    }
    const results = await this.sequelize.query(sql, {
      raw: true,
      bind,
    });
    return results[0] as TResult[];
  }

  public async createTransaction(): Promise<Transaction> {
    const transaction = new Transaction(this);
    await transaction.start();
    return transaction;
  }

  public async createTransactionManaged<T = any>(
    fn: (database: Database) => Promise<T>,
  ): Promise<T> {
    const transaction = await this.createTransaction();
    try {
      const result = await fn(this);
      await transaction.commit();
      return result;
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  public async close() {
    if (!this.connected) return;
    this.logger.info('closing database');
    await this.sequelize.close();
    this.connected = false;
  }

  public async connect(): Promise<Database> {
    if (this.connected) return this;
    this.logger.info('connecting in database');
    const options = CreateOptions.create();
    if (options.logging) {
      options.logging = (sql, object) => {
        sql = Util.removeLinesAndSpaceFromSql(sql);
        if (Env.get('DB_LOGGING_BASE64', false)) {
          sql = Util.stringToBase64(sql);
        }
        const obj = object as any;
        this.logger.info('query', {
          sql,
          bind: obj?.bind ?? obj?.replacements,
        });
      };
    } else {
      options.logging = false;
    }
    this.sequelize = new Sequelize(options);
    this.logger.info('authenticate in database');
    await this.sequelize.authenticate();
    this.logger.info('set timezone in database');
    await this.sequelize.query(`SET timezone TO '${CreateOptions.timezone()}'`);
    this.logger.info('set encoding in database');
    await this.sequelize.query(
      `SET client_encoding TO '${CreateOptions.charset()}'`,
    );
    this.connected = true;
    return this;
  }
}
