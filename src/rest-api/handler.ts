import { Request, Response } from 'express';

import {
  CacheInterface,
  ContainerInterface,
  ContainerName,
  LoggerInterface,
  PgPoolInterface,
  TranslationInterface,
} from '@/shared';

export abstract class AbstractHandler {
  protected readonly context: Request['context'];
  protected readonly container: ContainerInterface;
  protected readonly translation: TranslationInterface;
  protected readonly cacheClient: CacheInterface;
  protected readonly pgPool: PgPoolInterface;
  protected readonly logger: LoggerInterface;

  public constructor(
    protected readonly request: Request,
    protected readonly response: Response,
  ) {
    this.context = request.context;
    this.container = request.container;
    this.translation = request.translation;
    this.logger = request.logger;

    this.cacheClient = this.container.get(ContainerName.CACHE_CLIENT);
    this.pgPool = this.container.get(ContainerName.PG_POOL);
  }

  public abstract handle(): any | Promise<any>;
}
