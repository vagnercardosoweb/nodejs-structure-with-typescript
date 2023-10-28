import type { Request, Response } from 'express';

import type {
  CacheInterface,
  ContainerInterface,
  EventManagerInterface,
  LoggerInterface,
  PgPoolInterface,
  TranslationInterface,
} from '@/shared';
import { ContainerName } from '@/shared';

export abstract class AbstractHandler {
  protected readonly context: Request['context'];
  protected readonly container: ContainerInterface;
  protected readonly translation: TranslationInterface;
  protected readonly eventManager: EventManagerInterface;
  protected readonly cacheClient: CacheInterface;
  protected readonly pgPool: PgPoolInterface;
  protected readonly logger: LoggerInterface;

  public constructor(
    protected readonly request: Request,
    protected readonly response: Response,
  ) {
    this.context = request.context;
    this.container = request.container;

    this.pgPool = this.container.get(ContainerName.PG_POOL);
    this.cacheClient = this.container.get(ContainerName.CACHE_CLIENT);
    this.eventManager = this.container.get(ContainerName.EVENT_MANAGER);
    this.translation = this.container.get(ContainerName.TRANSLATION);
    this.logger = this.container.get(ContainerName.LOGGER);
  }

  public abstract handle(): any | Promise<any>;
}
