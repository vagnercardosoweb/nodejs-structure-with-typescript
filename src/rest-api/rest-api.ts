import http from 'node:http';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { Application, NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import httpGraceFullShutdown from 'http-graceful-shutdown';
import responseTime from 'response-time';

import { HOSTNAME } from '@/config/constants';
import {
  Container,
  ContainerInterface,
  ContainerName,
  ContainerValue,
  DurationTime,
  Env,
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
  timestamp,
} from './middlewares';
import { BeforeCloseFn, Route } from './types';

export class RestApi {
  protected readonly app: Application;
  protected readonly routes = new Map<string, Route>();
  protected readonly container: ContainerInterface;
  protected readonly beforeCloseFn: BeforeCloseFn[] = [];
  protected readonly server: http.Server;

  public constructor(
    protected readonly port: number,
    protected readonly secret: string,
  ) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.container = new Container();

    this.initExpress();

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

  public beforeClose(fn: BeforeCloseFn) {
    if (!this.beforeCloseFn.some((f) => f === fn)) this.beforeCloseFn.push(fn);
    return this;
  }

  public addRoute(route: Route): void {
    route.method = route.method.toUpperCase() as HttpMethod;
    const key = `${route.method} ${route.path}`;

    if (this.routes.has(key)) {
      throw new InternalServerError({
        message: 'Route "{{routeName}}" already exists registered',
        metadata: { routeName: `${route.method} ${route.path}` },
      });
    }

    this.routes.set(key, route);
  }

  public getServer(): http.Server {
    return this.server;
  }

  public getExpress(): express.Application {
    return this.app;
  }

  public getRoutes(): Route[] {
    return Array.from(this.routes.values());
  }

  public getPort(): number {
    return this.port;
  }

  public async listen(): Promise<http.Server> {
    return new Promise((resolve, reject) => {
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
          onShutdown: async () => this.runBeforeClose(),
          forceExit: true,
        });

        this.start();
        resolve(this.server);
      });

      this.server.listen(this.port);
    });
  }

  public async close(): Promise<void> {
    await this.runBeforeClose();
    if (!this.server.listening) return;
    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => {
        if (error) reject(error);
        resolve();
      });
    });
  }

  public start() {
    this.app.use((request, _, next) => {
      request.durationTime = new DurationTime();
      next();
    });

    this.app.use(cors);
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(responseTime());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser(this.secret));
    this.app.use(timestamp);
    this.app.use(app(this.container));
    this.app.use(methodOverride);
    this.app.use(extractToken);
    this.app.use(requestLog);

    this.registerRoutes();

    this.app.use(notFound);
    this.app.use(errorHandler);

    return this.app;
  }

  protected async runBeforeClose() {
    await Promise.all(this.beforeCloseFn.map((fn) => fn()));
  }

  protected responseHandle({
    request,
    response,
    result,
  }: {
    request: Request;
    response: Response;
    result: any;
  }) {
    if (result?.hasOwnProperty('socket')) return result.end();
    if (!result) return response.sendStatus(HttpStatusCode.NO_CONTENT);

    response
      .json({
        data: result,
        path: `${request.method} ${request.originalUrl}`,
        ipAddress: request.ip,
        duration: request.durationTime.format(),
        timezone: Env.getTimezoneUtc(),
        environment: Env.get('NODE_ENV'),
        hostname: HOSTNAME,
        requestId: request.context.requestId,
        userAgent: request.headers['user-agent'],
        brlDate: Utils.createBrlDate(),
        utcDate: Utils.createUtcDate(),
      })
      .end();
  }

  protected registerRoutes() {
    for (const route of this.getRoutes()) {
      const method = (route.method ?? HttpMethod.GET).toLowerCase();
      const middlewares = route.middlewares ?? [];

      (this.app as any)[method](
        route.path,
        ...middlewares,
        (request: Request, response: Response, next: NextFunction) => {
          const prototype = Object.getPrototypeOf(route.handler);
          if (prototype?.name !== AbstractHandler.name) {
            return (route.handler as any)(request, response, next);
          }

          const Handler = route.handler as any;
          const handler = new Handler(request, response);
          const result = handler.handle();

          const isPromise = result instanceof Promise;
          if (isPromise) {
            result
              .then((result) =>
                this.responseHandle({
                  request,
                  response,
                  result,
                }),
              )
              .catch(next);
          } else {
            this.responseHandle({
              request,
              response,
              result,
            });
          }
        },
      );
    }
  }

  protected initExpress() {
    this.app.set('trust proxy', true);
    this.app.set('strict routing', true);
    this.app.set('x-powered-by', false);
  }
}
