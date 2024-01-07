import type { NextFunction, Request, Response } from 'express';

import { HttpMethod } from '@/shared/enums';

export type BeforeCloseFn = () => Promise<void>;

export type HandlerFn = (
  request: Request,
  response: Response,
  next: NextFunction,
) => any | Promise<any>;

export type Handler = {
  method: HttpMethod;
  handlers: HandlerFn[];
  path: string;
};
