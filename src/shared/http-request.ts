import http, { IncomingHttpHeaders } from 'node:http';
import https, { RequestOptions } from 'node:https';

import { HttpMethod, HttpStatusCode } from '@/shared/enums';
import {
  AppError,
  GatewayTimeoutError,
  InternalServerError,
} from '@/shared/errors';
import { LoggerInterface } from '@/shared/logger';
import { jsonParseOrDefault } from '@/shared/utils';

export interface HttpRequest extends RequestOptions {
  body?: string;
  method: HttpMethod;
  logger?: LoggerInterface;
  url: string;
}

export interface HttpResponse<T = any> {
  statusCode: number;
  headers: IncomingHttpHeaders;
  body: T;
}

const makeError = (externalError: any, metadata: any) => {
  const error =
    externalError instanceof AppError
      ? externalError
      : new InternalServerError({
          message: externalError.message,
          originalError: externalError,
          code: 'HTTP_REQUEST_ERROR',
        });
  error.stack = externalError.stack;
  error.metadata = metadata;
  return error;
};

export const httpRequest = async <T = any>(
  options: HttpRequest,
): Promise<HttpResponse<T>> => {
  const { url, body, logger, ...rest } = options;

  delete options.logger;
  const httpInstance = url.startsWith('https://') ? https : http;

  if (logger) logger.info('HTTP_REQUEST_STARTED', options);

  const response = await new Promise<HttpResponse>((resolve, reject) => {
    const request = httpInstance.request(url, rest, async (res) => {
      const chunks: any[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('error', (e) => reject(makeError(e, options)));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString().trim();
        const { statusCode = HttpStatusCode.OK, headers } = res;
        resolve({
          body: jsonParseOrDefault(data),
          statusCode: Number(statusCode),
          headers,
        });
      });
    });

    request.on('timeout', () =>
      request.destroy(makeError(new GatewayTimeoutError(), options)),
    );

    request.on('error', (e) => reject(makeError(e, options)));
    if (body?.trim()?.length) request.write(body);

    request.end();
  });

  if (logger) logger.info('HTTP_REQUEST_COMPLETED', response);

  return response;
};
