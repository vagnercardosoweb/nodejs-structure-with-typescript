import cookieParser from 'cookie-parser';
import express, { RequestHandler } from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import http from 'http';
import morgan from 'morgan';

import { NodeEnv } from '@/enums';
import {
	corsMiddleware,
	errorHandlerMiddleware,
	generateRequestIdMiddleware,
	methodOverrideMiddleware,
	notFoundMiddleware,
} from '@/middlewares';
import { Env } from '@/utils';

import appRoutes from './routes';

class App {
	protected app: express.Application;
	protected server: http.Server;
	protected port: number;

	constructor() {
		this.app = express();
		this.server = http.createServer(this.app);
		this.port = Number(process.env.PORT || 3333);

		this.app.set('trust proxy', true);
		this.app.set('x-powered-by', false);
	}

	public registerMiddlewares(): void {
		this.app.use(express.json() as RequestHandler);
		this.app.use(express.urlencoded({ extended: true }) as RequestHandler);
		this.app.use(cookieParser(Env.required('APP_KEY')));

		if (Env.required('NODE_ENV') !== NodeEnv.TEST) {
			this.app.use(helmet() as RequestHandler);
			this.app.use(morgan('combined'));
			this.app.use(corsMiddleware);
			this.app.use(methodOverrideMiddleware);
			this.app.use(generateRequestIdMiddleware);
		}
	}

	public registerErrorHandling() {
		this.app.use(notFoundMiddleware);
		this.app.use(errorHandlerMiddleware);
	}

	public registerRoutes() {
		this.app.use(appRoutes);
	}

	public async start(): Promise<http.Server> {
		return new Promise((resolve) => {
			this.server = this.server.listen(this.port, () => {
				this.registerMiddlewares();
				this.registerRoutes();
				this.registerErrorHandling();

				resolve(this.server);
			});
		});
	}

	public async close(): Promise<void> {
		if (!this.server.listening) {
			return;
		}

		await new Promise((_, reject) => {
			this.server.close((err) => {
				if (err) reject(err);
			});
		});
	}

	public getPort(): number {
		return this.port;
	}

	public getServer(): http.Server {
		return this.server;
	}

	public getApp(): express.Application {
		return this.app;
	}
}

export default new App();
