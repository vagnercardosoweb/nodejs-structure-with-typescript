import { randomUUID } from 'node:crypto';
import http from 'node:http';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import responseTime from 'response-time';

import { constants } from '@/config/constants';
import { AbstractHandler } from '@/rest-api/handler';
import {
  app,
  cors,
  errorHandler,
  extractToken,
  methodOverride,
  noCache,
  notFound,
  requestLog,
  timestamp,
} from '@/rest-api/middlewares';
import { BeforeCloseFn, Route } from '@/rest-api/types';
import { Common } from '@/shared/common';
import {
  Container,
  ContainerInterface,
  ContainerName,
  ContainerValue,
} from '@/shared/container';
import { DurationTime } from '@/shared/duration-time';
import { HttpMethod, HttpStatusCode } from '@/shared/enums';
import { Env } from '@/shared/env';
import { AppError } from '@/shared/errors';
import { Logger, LoggerInterface } from '@/shared/logger';

export class RestApi {
  protected readonly app: Application;
  protected readonly routes = new Map<string, Route>();
  protected readonly serverId = randomUUID();
  protected readonly container: ContainerInterface;
  protected readonly logger: LoggerInterface;
  protected readonly beforeCloseFn: BeforeCloseFn[] = [];
  protected readonly server: http.Server;

  public constructor(
    protected readonly port: number,
    protected readonly secret: string,
  ) {
    this.app = express();
    this.server = http.createServer(this.app);

    this.container = new Container();
    this.logger = new Logger(this.serverId);

    this.app.set('trust proxy', true);
    this.app.set('strict routing', true);
    this.app.set('x-powered-by', false);

    this.set(ContainerName.PORT, this.port);
    this.set(ContainerName.LOGGER, this.logger);
    this.set(ContainerName.SERVER_ID, this.serverId);
    this.set(ContainerName.APP_KEY, this.secret);
  }

  public set(name: ContainerName, value: ContainerValue) {
    this.container.set(name, value);
    return this;
  }

  public beforeClose(fn: BeforeCloseFn) {
    if (!this.beforeCloseFn.some((f) => f === fn)) this.beforeCloseFn.push(fn);
    return this;
  }

  public addRoute(route: Route): void {
    route.method = route.method.toUpperCase() as HttpMethod;
    const key = `${route.method} ${route.path}`;

    if (this.routes.has(key)) {
      throw new AppError({
        message: `Route "${key}" already exists registered`,
        code: 'ROUTE_ALREADY_EXISTS',
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

  public getContainer(): ContainerInterface {
    return this.container;
  }

  public getServerId(): string {
    return this.serverId;
  }

  public getLogger(): LoggerInterface {
    return this.logger;
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
        this.startHandlers();
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

  public startHandlers() {
    this.app.use(responseTime());

    this.app.use((request, _, next) => {
      request.durationTime = new DurationTime();
      request.container = this.container.clone();
      next();
    });

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use(cors);
    this.app.use(noCache);
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cookieParser(this.secret));

    this.app.use(timestamp);
    this.app.use(app);
    this.app.use(requestLog);
    this.app.use(methodOverride);
    this.app.use(extractToken);

    this.makeRoutes();

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
        hostname: constants.HOSTNAME,
        requestId: request.context.requestId,
        userAgent: request.headers['user-agent'],
        brlDate: Common.createBrlDate(),
        utcDate: Common.createUtcDate(),
      })
      .end();
  }

  protected makeRoutes() {
    for (const route of this.getRoutes()) {
      (this.app as any)[(route.method ?? HttpMethod.GET).toLowerCase()](
        route.path,
        ...(route.middlewares ?? []),
        (request: Request, response: Response, next: NextFunction) => {
          const prototype = Object.getPrototypeOf(route.handler);

          if (prototype.name !== AbstractHandler.name) {
            const result = (route.handler as any)(request, response, next);
            if (result instanceof Promise) result.catch(next);
            return result;
          }

          const Handler = route.handler as any;
          const handler = new Handler(request, response);
          const result = handler.handle();

          if (result instanceof Promise) {
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
}
