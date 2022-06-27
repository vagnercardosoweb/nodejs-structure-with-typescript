import 'reflect-metadata';
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';

import { InternalServerError } from '@/errors';
import Logger from '@/utils/logger';

import { Config } from './config';

export class Database {
	private static instance: Database | null = null;
	private sequelize: Sequelize | null = null;

	private constructor() {}

	public static getInstance(): Database {
		if (this.instance === null) {
			this.instance = new Database();
		}

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

	public async close() {
		Logger.info('closing sequelize');

		if (this.sequelize !== null) {
			await this.sequelize.close();
		}

		this.sequelize = null;
	}

	public async connect(options?: SequelizeOptions): Promise<Database> {
		if (this.sequelize === null) {
			Logger.info('creating sequelize');
			this.sequelize = new Sequelize(Config.create(options));

			Logger.info('sequelize authenticate');
			await this.sequelize.authenticate();

			Logger.info('sequelize set timezone and encoding');
			await this.sequelize.query(`SET timezone TO '${Config.getTimezone()}'`);
			await this.sequelize.query(`SET client_encoding TO '${Config.getCharset()}'`);
		}

		return this;
	}
}
