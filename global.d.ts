import { RequestHandler } from 'express';

import { AuthType, HttpMethod } from '@/enums';

export type Route = {
  path: string;
  method?: HttpMethod;
  handler: RequestHandler;
  handlers?: RequestHandler[];
  authType?: AuthType;
  public?: boolean;
};

declare global {
  export namespace Express {
    export interface Request {
      context: {
        requestId: string;
        jwt: {
          sub: string;
          token: string;
          type: string;
        };
      };
    }
  }
}
