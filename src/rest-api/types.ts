import type { NextFunction, Request, Response } from 'express';

import { HttpMethod } from '@/shared/enums';

export type BeforeCloseFn = () => Promise<void>;

export type Handler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => any | Promise<any>;

export type Route = {
  method: HttpMethod;
  handlers: Handler[];
  path: string;
};
