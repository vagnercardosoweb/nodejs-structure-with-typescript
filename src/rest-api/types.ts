import { Request, RequestHandler, Response } from 'express';

import { AbstractHandler } from '@/rest-api/handler';
import { AuthType, HttpMethod } from '@/shared/enums';

export type Handler = RequestHandler;

export type Route = {
  path: string;
  method?: HttpMethod;
  handler:
    | Handler
    | { new (request: Request, response: Response): AbstractHandler };
  middlewares?: Handler[];
  authType?: AuthType;
  public?: boolean;
};

export type OnCloseFn = () => void | Promise<void>;
