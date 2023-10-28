import { NextFunction, Request, Response } from 'express';

import { cors as configCors } from '@/config/cors';
import { HttpMethod, HttpStatusCode } from '@/shared';

const { origin, methods, headers } = configCors;

export const cors = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  response.header('Access-Control-Allow-Origin', origin);
  response.header('Access-Control-Allow-Methods', methods.join(','));
  response.header('Access-Control-Allow-Headers', headers.join(','));
  response.header('Access-Control-Allow-Credentials', 'true');
  if (request.method.toUpperCase() === HttpMethod.OPTIONS) {
    return response.sendStatus(HttpStatusCode.OK);
  }
  return next();
};
