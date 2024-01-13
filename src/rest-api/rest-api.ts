import { randomUUID } from 'node:crypto';
import http from 'node:http';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import helmet from 'helmet';
import responseTime from 'response-time';

import {
  app,
  cors,
  errorHandler,
  methodOverride,
  noCache,
  notFound,
  requestLog,
  timestamp,
} from '@/rest-api/middlewares';
import { BeforeCloseFn, type Handler, type HandlerFn } from '@/rest-api/types';
import {
  Container,
  type ContainerInterface,
  ContainerName,
  ContainerValue,
} from '@/shared/container';
import { DurationTime } from '@/shared/duration-time';
import { HttpMethod } from '@/shared/enums';
import { AppError } from '@/shared/errors';
import { Logger, type LoggerInterface } from '@/shared/logger';

export class RestApi {
  protected readonly app: Application;
  protected readonly handlers = new Map<string, Handler>();
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

  public addHandler(
    method: HttpMethod,
    path: string,
    ...handlers: HandlerFn[]
  ): void {
    method = method.toUpperCase() as HttpMethod;
    const key = `${method} ${path}`;

    if (this.handlers.has(key)) {
      throw new AppError({
        message: `Route "${key}" already exists registered`,
        code: 'ROUTE_ALREADY_EXISTS',
      });
    }

    this.handlers.set(key, {
      method,
      handlers: handlers.map(this.asyncHandler.bind(this)),
      path,
    });
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

  public getHandlers(): Handler[] {
    return Array.from(this.handlers.values());
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

  public async close() {
    await new Promise<void>((resolve, reject) => {
      if (!this.server.listening) return resolve();
      this.server.close((error) => {
        if (error) reject(error);
        resolve();
      });
    }).finally(async () => {
      await this.runBeforeClose();
    });
  }

  public startHandlers() {
    this.app.use(responseTime());

    this.app.use((request, _, next) => {
      request.durationTime = new DurationTime();
      request.container = this.container.clone();
      request.skipRequestLog = false;
      next();
    });

    this.app.use(cors);
    this.app.use(noCache);
    this.app.use(timestamp);
    this.app.use(helmet());

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser(this.secret));
    this.app.use(compression());

    this.app.use(app);
    this.app.use(requestLog);
    this.app.use(methodOverride);

    this.makeHandlers();

    this.app.use(notFound);
    this.app.use(errorHandler);

    return this.app;
  }

  protected async runBeforeClose() {
    await Promise.all(this.beforeCloseFn.map((fn) => fn()));
  }

  protected asyncHandler(fn: HandlerFn) {
    return (request: Request, response: Response, next: NextFunction) => {
      try {
        const result = fn(request, response, next);
        if (result instanceof Promise) return result.catch(next);
        return result;
      } catch (e) {
        return next(e);
      }
    };
  }

  protected makeHandlers() {
    for (const route of this.getHandlers()) {
      const middlewares =
        route.handlers.length > 1 ? route.handlers.slice(0, 1) : [];
      const handle = route.handlers[route.handlers.length - 1];
      (this.app as any)[route.method.toLowerCase()](
        route.path,
        ...middlewares,
        handle,
      );
    }
  }
}
