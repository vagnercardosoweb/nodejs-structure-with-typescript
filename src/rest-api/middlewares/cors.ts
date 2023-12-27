import { NextFunction, Request, Response } from 'express';

import { cors as configCors } from '@/config/cors';
import { HttpMethod, HttpStatusCode } from '@/shared/enums';

const { origin, methods, headers } = configCors;

export const cors = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Methods', methods.join(','));
  response.setHeader('Access-Control-Allow-Headers', headers.join(','));
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  if (request.method.toUpperCase() === HttpMethod.OPTIONS) {
    response.setHeader('Content-Length', '0');
    return response.sendStatus(HttpStatusCode.NO_CONTENT);
  }
  return next();
};
