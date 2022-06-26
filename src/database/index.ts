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

	private static async authenticate() {
		Logger.info('creating connection with sequelize orm');

		const sequelize = Database.getSequelize();
		await sequelize.authenticate();

		await sequelize.query(`SET timezone TO '${Config.getTimezone()}'`);
		await sequelize.query(`SET client_encoding TO '${Config.getCharset()}'`);
	}

	public async close() {
		Logger.info('closing connection with sequelize orm');

		if (this.sequelize !== null) {
			await this.sequelize.close();
		}

		this.sequelize = null;
	}

	public async connect(options?: SequelizeOptions): Promise<Database> {
		if (this.sequelize === null) {
			this.sequelize = new Sequelize(Config.create(options));
			await Database.authenticate();
		}

		return this;
	}
}
