import 'reflect-metadata';

import '../config/dotenv';
import '../config/module-alias';

import { Database } from '@/database';
import { errorToObject, Logger, Redis } from '@/utils';

import App from './app';

const handleCloseDependencies = async () => {
	await Redis.getInstance().close();
	await Database.getInstance().close();
	await App.close();

	process.exit(0);
};

(async () => {
	process.on('SIGINT', handleCloseDependencies);
	process.on('SIGTERM', handleCloseDependencies);
	process.on('SIGQUIT', handleCloseDependencies);

	process.on('unhandledRejection', (reason, promise) => {
		Logger.error(`App exiting due to an unhandled promise: ${promise} and reason: ${reason}`);
		throw reason;
	});

	process.on('uncaughtException', (error) => {
		Logger.error(`App exiting due to an uncaught exception: ${error}`);
		process.exit(1);
	});

	try {
		await Redis.getInstance().connect();
		await Database.getInstance().connect();
		await App.start();

		Logger.info(`server started on http://localhost:${App.getPort()}`);
	} catch (e: any) {
		await handleCloseDependencies();
		Logger.error(`server initialization failed`, errorToObject(e));
		process.exit(1);
	}
})();
