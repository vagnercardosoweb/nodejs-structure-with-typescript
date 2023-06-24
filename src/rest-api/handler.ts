import { Request, Response } from 'express';

import {
  ContainerInterface,
  LoggerInterface,
  TranslationInterface,
} from '@/shared';

export abstract class AbstractHandler {
  protected readonly context: Request['context'];
  protected readonly container: ContainerInterface;
  protected readonly translation: TranslationInterface;
  protected readonly logger: LoggerInterface;

  public constructor(
    protected readonly request: Request,
    protected readonly response: Response,
  ) {
    this.context = request.context;
    this.container = request.container;
    this.translation = request.translation;
    this.logger = request.logger;
  }

  public abstract handle(): any | Promise<any>;
}
