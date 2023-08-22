import { Request, RequestHandler, Response } from 'express';

import { AbstractHandler } from '@/rest-api/handler';
import { HttpMethod } from '@/shared/enums';

export type Handler = RequestHandler;

export type Route = {
  path: string;
  method: HttpMethod;
  middlewares?: Handler[];
  handler:
    | Handler
    | { new (request: Request, response: Response): AbstractHandler };
};

export type BeforeCloseFn = () => Promise<void>;
