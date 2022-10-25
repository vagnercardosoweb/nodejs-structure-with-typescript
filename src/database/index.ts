import 'reflect-metadata';

import { Transaction, TransactionOptions } from 'sequelize';
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';

import { InternalServerError } from '@/errors';
import { Env, Logger } from '@/shared';

import { Config } from './config';

export class Database {
  private static instance: Database | null = null;
  private sequelize: Sequelize | null = null;
  private logger: typeof Logger;

  private constructor() {
    this.logger = Logger.newInstance('DATABASE');
  }

  public static getInstance(): Database {
    if (this.instance === null) this.instance = new Database();
    return this.instance;
  }

  public static getSequelize(): Sequelize {
    const { sequelize } = Database.getInstance();
    if (sequelize === null) {
      throw new InternalServerError({
        description: 'sequelize is not initialized',
      });
    }
    return sequelize;
  }

  public async createTransaction(
    options?: TransactionOptions,
  ): Promise<Transaction> {
    const transaction = await Database.getSequelize().transaction(options);
    return transaction;
  }

  public async createTransactionManaged<Result = any>(
    fn: (transaction: Transaction) => PromiseLike<Result>,
    options: TransactionOptions = {},
  ): Promise<Result> {
    const result = await Database.getSequelize().transaction<Result>(
      options,
      fn,
    );
    return result;
  }

  public isConnected(): boolean {
    return this.sequelize !== null;
  }

  public async close() {
    this.logger.info('closing database...');
    if (this.sequelize !== null) await this.sequelize.close();
    this.sequelize = null;
  }

  public async connect(options?: SequelizeOptions): Promise<Database> {
    if (this.sequelize === null) {
      this.logger.info('connecting in database...');
      const parseOptions = Config.create(options);
      if (Env.get('DB_LOGGING', false)) {
        parseOptions.logging = (sql) =>
          this.logger.info(Config.transformSql(sql));
      } else {
        parseOptions.logging = false;
      }
      this.sequelize = new Sequelize(parseOptions);
      this.logger.info('checking database...');
      await this.sequelize.authenticate();
      this.logger.info('set timezone and encoding in database...');
      await this.sequelize.query(`SET timezone TO '${Config.getTimezone()}'`);
      await this.sequelize.query(
        `SET client_encoding TO '${Config.getCharset()}'`,
      );
    }
    return this;
  }
}
