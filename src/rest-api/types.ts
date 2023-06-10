import { AuthType, HttpMethod } from '@/shared/enums';

export type RequestHandler = import('express').RequestHandler;

export type Route = {
  path: string;
  method?: HttpMethod;
  handler: RequestHandler;
  middlewares?: RequestHandler[];
  isPublic?: boolean;
  authType?: AuthType;
};

export type OnCloseFn = () => void | Promise<void>;
