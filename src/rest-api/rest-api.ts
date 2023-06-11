import 'express-async-errors';

import http from 'node:http';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, {
  Application,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import helmet from 'helmet';
import httpGraceFullShutdown from 'http-graceful-shutdown';
import responseTime from 'response-time';

import {
  Container,
  ContainerInterface,
  ContainerName,
  ContainerValue,
  HttpMethod,
  HttpStatusCode,
  InternalServerError,
  Utils,
} from '@/shared';

import { AbstractHandler } from './handler';
import {
  app,
  cors,
  errorHandler,
  extractToken,
  methodOverride,
  notFound,
  requestLog,
  withAuth,
  withPermission,
  withToken,
} from './middlewares';
import { OnCloseFn, Route } from './types';

export class RestApi {
  private readonly app: Application;
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
      if (Utils.isUndefined(route.public)) route.public = false;
      let middlewares: RequestHandler[] = route.middlewares || [];

      if (route.authType) {
        middlewares = [
          withAuth(route.authType),
          withPermission,
          ...middlewares,
        ];
      }

      if (!route.public || route.authType) {
        middlewares = [withToken, ...middlewares];
      }

      const method = (route.method ?? HttpMethod.GET).toLowerCase();
      (this.app as any)[method](
        route.path,
        ...middlewares,
        async (request: Request, response: Response, next: NextFunction) => {
          const prototype = Object.getPrototypeOf(route.handler);
          if (prototype?.name !== AbstractHandler.name) {
            return (route.handler as any)(request, response, next);
          }

          const Handler = route.handler as any;
          const result = await new Handler(request, response).handle();

          if (!result && response.statusCode === HttpStatusCode.OK) {
            return response.sendStatus(HttpStatusCode.NO_CONTENT);
          }

          return response.json({
            data: result,
            timestamp: new Date().toISOString(),
            ipAddress: request.ip,
            path: `${request.method} ${request.originalUrl}`,
            duration: '0ms',
          });
        },
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
