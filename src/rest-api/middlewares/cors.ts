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
    response.header('Content-Length', '0');
    return response.sendStatus(HttpStatusCode.NO_CONTENT);
  }
  return next();
};
