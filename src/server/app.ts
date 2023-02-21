import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { RequestHandler } from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import http from 'http';

import { HttpMethod } from '@/enums';
import {
  checkAccessByRouteHandler,
  configureAppHandler,
  corsHandler,
  errorHandler,
  extractTokenHandler,
  isAuthenticatedHandler,
  methodOverrideHandler,
  notFoundHandler,
  requestLogHandler,
  routeWithTokenHandler,
} from '@/handlers';
import appRoutes, { makeDefaultRoutes } from '@/server/routes';
import { Env } from '@/shared';

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

  public registerHandlers(): void {
    this.app.use(corsHandler);
    this.app.use(helmet() as RequestHandler);
    this.app.use(compression());
    this.app.use(cookieParser(Env.required('APP_KEY')));
    this.app.use(express.json() as RequestHandler);
    this.app.use(express.urlencoded({ extended: true }) as RequestHandler);
    this.app.use(methodOverrideHandler);
    this.app.use(configureAppHandler);
    this.app.use(extractTokenHandler);
    this.app.use(requestLogHandler);
  }

  public registerErrorHandlers() {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async registerRoutes() {
    this.app.use(makeDefaultRoutes());
    // const directory = path.resolve(__dirname, '..', 'modules');
    // const modules = await fs.opendir(directory);
    // for await (const dir of modules) {
    //   if (!dir.isDirectory()) continue;
    //   const routePath = path.resolve(directory, dir.name, 'routes');
    //   try {
    //     const routes = (await import(routePath)).default;
    //     if (!Array.isArray(routes)) continue;
    //     Logger.info(`register route path ${routePath}`);
    //     appRoutes.push(...routes);
    //   } catch (e: any) {
    //     Logger.warn('register route error', { stack: e.stack });
    //   }
    // }
    for (const route of appRoutes) {
      route.method = route.method ?? HttpMethod.GET;
      route.handlers = route.handlers ?? [];
      route.public = route.public ?? false;
      const handlers: RequestHandler[] = [];
      if (!route.public) handlers.push(routeWithTokenHandler);
      if (route.authType) {
        handlers.push(isAuthenticatedHandler(route.authType));
        handlers.push(checkAccessByRouteHandler);
      }
      (<any>this.app)[route.method.toLowerCase()](
        route.path,
        ...handlers,
        ...route.handlers,
        route.handler,
      );
    }
  }

  public async createServer(): Promise<http.Server> {
    return new Promise((resolve, reject) => {
      this.server = this.server.listen(this.port);
      this.server.on('error', reject);
      this.server.on('listening', async () => {
        this.registerHandlers();
        await this.registerRoutes();
        this.registerErrorHandlers();
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
