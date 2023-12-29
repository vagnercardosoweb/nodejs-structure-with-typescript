import type { Request, Response } from 'express';

import type { CacheInterface } from '@/shared/cache';
import { type ContainerInterface, ContainerName } from '@/shared/container';
import type { EventManagerInterface } from '@/shared/event-manager';
import type { LoggerInterface } from '@/shared/logger';
import type { PasswordHashInterface } from '@/shared/password-hash';
import type { PgPoolInterface } from '@/shared/postgres';
import type { TranslationInterface } from '@/shared/translation';

export abstract class AbstractHandler {
  protected readonly context: Request['context'];
  protected readonly container: ContainerInterface;
  protected readonly translation: TranslationInterface;
  protected readonly passwordHash: PasswordHashInterface;
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
    this.passwordHash = this.container.get(ContainerName.PASSWORD_HASH);
    this.cacheClient = this.container.get(ContainerName.CACHE_CLIENT);
    this.eventManager = this.container.get(ContainerName.EVENT_MANAGER);
    this.translation = this.container.get(ContainerName.TRANSLATION);
    this.logger = this.container.get(ContainerName.LOGGER);
  }

  public abstract handle(): any | Promise<any>;
}
