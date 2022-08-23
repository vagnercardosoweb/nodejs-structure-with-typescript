import cookieParser from 'cookie-parser';
import express, { RequestHandler } from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import http from 'http';
import morgan from 'morgan';

import configRoutes from '@/config/routes';
import { HttpMethod, NodeEnv } from '@/enums';
import {
  checkAccessByRouteMiddleware,
  corsMiddleware,
  errorHandlerMiddleware,
  extractTokenMiddleware,
  isAuthenticatedMiddleware,
  loggerMetadataMiddleware,
  methodOverrideMiddleware,
  notFoundMiddleware,
  routeWithTokenMiddleware,
} from '@/middlewares';
import { Env } from '@/utils';

export class App {
  protected app: express.Application;
  protected server: http.Server;
  protected port: number;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = Env.get('PORT', 3333);

    this.app.set('trust proxy', true);
    this.app.set('x-powered-by', false);
    this.app.set('strict routing', true);
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
      this.app.use(loggerMetadataMiddleware);
    }

    this.app.use(extractTokenMiddleware);
  }

  public registerErrorHandling() {
    this.app.use(notFoundMiddleware);
    this.app.use(errorHandlerMiddleware);
  }

  public registerRoutes() {
    configRoutes.forEach((route) => {
      route.method = route.method ?? HttpMethod.GET;
      route.middlewares = route.middlewares ?? [];
      route.public = route.public ?? false;

      const middlewares: RequestHandler[] = [];
      if (route.public === false) middlewares.push(routeWithTokenMiddleware);

      if (route.authType) {
        middlewares.push(isAuthenticatedMiddleware(route.authType));
        middlewares.push(checkAccessByRouteMiddleware);
      }

      (<any>this.app)[route.method.toLowerCase()](
        route.path,
        ...middlewares,
        ...route.middlewares,
        route.handler,
      );
    });
  }

  public async createServer(): Promise<http.Server> {
    return new Promise((resolve, reject) => {
      this.server = this.server.listen(this.port);

      this.server.on('error', reject);
      this.server.on('listening', () => {
        this.registerMiddlewares();
        this.registerRoutes();
        this.registerErrorHandling();

        resolve(this.server);
      });
    });
  }

  public async closeServer(): Promise<void> {
    if (!this.server.listening) return;

    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => {
        if (error) reject(error);
        resolve();
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
