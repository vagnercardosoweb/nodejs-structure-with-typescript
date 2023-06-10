import 'express-async-errors';

import http from 'node:http';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { RequestHandler } from 'express';
import helmet from 'helmet';
import httpGraceFullShutdown from 'http-graceful-shutdown';
import responseTime from 'response-time';

import {
  Container,
  ContainerInterface,
  ContainerName,
  ContainerValue,
  HttpMethod,
  InternalServerError,
  Utils,
} from '@/shared';

import {
  app,
  cors,
  errorHandler,
  extractToken,
  isAuthenticated,
  methodOverride,
  notFound,
  requestLog,
  withPermission,
  withToken,
} from './middlewares';
import { OnCloseFn, Route } from './types';

export class RestApi {
  private readonly app: express.Application;
  private readonly routes: Route[] = [];
  private readonly container: ContainerInterface;
  private readonly onCloseFn: OnCloseFn[] = [];
  private readonly server: http.Server;

  public constructor(
    private readonly port: number,
    private readonly secret: string,
  ) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.container = new Container();

    this.initExpress();

    this.set('routes', this.routes);
    this.set('secret', this.secret);
    this.set('port', this.port);
  }

  public set(name: any, value: ContainerValue) {
    this.container.set(name, value);
    return this;
  }

  public get<T>(name: ContainerName): T {
    return this.container.get<T>(name);
  }

  public addOnClose(fn: OnCloseFn) {
    if (!this.onCloseFn.some((f) => f === fn)) this.onCloseFn.push(fn);
    return this;
  }

  public addRoute(route: Route): void {
    if (
      this.routes.some(
        (r) => r.method === route.method && r.path === route.path,
      )
    ) {
      throw new InternalServerError({
        message: 'Route ({routeName}) already exists registered',
        metadata: { routeName: `${route.method} ${route.path}` },
        sendToSlack: false,
      });
    }

    this.routes.push(route);
    this.set('routes', this.routes);
  }

  public getServer(): http.Server {
    return this.server;
  }

  public getExpress(): express.Application {
    return this.app;
  }

  public getRoutes(): Route[] {
    return this.routes;
  }

  public getPort(): number {
    return this.port;
  }

  public async start(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.server.on('error', (error: any) => {
        console.log(error);
        if (error?.code !== 'EADDRINUSE') reject(error);
        setTimeout(() => {
          this.server.close();
          this.server.listen(this.port);
        }, 500);
      });

      this.server.on('listening', () => {
        httpGraceFullShutdown(this.server, {
          signals: 'SIGINT SIGTERM SIGQUIT',
          onShutdown: async () => this.performOnClose(),
          forceExit: true,
        });

        this.registerDefaultHandlers();
        this.registerRouteHandlers();
        this.registerErrorHandlers();

        resolve();
      });

      this.server.listen(this.port);
    });
  }

  public async close(): Promise<void> {
    await this.performOnClose();
    if (!this.server.listening) return;
    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => {
        if (error) reject(error);
        resolve();
      });
    });
  }

  private async performOnClose() {
    await Promise.all(this.onCloseFn.map((fn) => fn()));
  }

  private registerDefaultHandlers() {
    this.app.use(cors);
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(responseTime());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser(this.secret));
    this.app.use(app(this.container));
    this.app.use(methodOverride);
    this.app.use(extractToken);
    this.app.use(requestLog);
  }

  private registerRouteHandlers() {
    for (const route of this.routes) {
      route.method = route.method ?? HttpMethod.GET;
      if (Utils.isUndefined(route.isPublic)) route.isPublic = false;

      const handlers: RequestHandler[] = [];

      if (!route.isPublic) handlers.push(withToken);
      if (route.authType) {
        handlers.push(isAuthenticated(route.authType));
        handlers.push(withPermission);
      }

      handlers.push(...(route.middlewares || []));

      (this.app as any)[route.method.toLowerCase()](
        route.path,
        ...handlers,
        route.handler,
      );
    }
  }

  private registerErrorHandlers() {
    this.app.use(notFound);
    this.app.use(errorHandler);
  }

  private initExpress() {
    this.app.set('trust proxy', true);
    this.app.set('strict routing', true);
    this.app.set('x-powered-by', false);
  }
}
