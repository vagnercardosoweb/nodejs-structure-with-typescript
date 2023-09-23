import http, { IncomingHttpHeaders } from 'node:http';
import https, { RequestOptions } from 'node:https';

import { LoggerInterface } from '@/shared';
import { HttpMethod, HttpStatusCode } from '@/shared/enums';
import {
  AppError,
  GatewayTimeoutError,
  InternalServerError,
} from '@/shared/errors';
import { Utils } from '@/shared/utils';

export interface HttpRequest extends RequestOptions {
  body?: string;
  method?: HttpMethod;
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
          code: 'HTTP_REQUEST_ERROR',
          message: externalError.message,
          originalError: externalError,
        });
  error.stack = externalError.stack;
  error.metadata = metadata;
  return error;
};

export const httpRequest = async <T = any>(
  options: HttpRequest,
): Promise<HttpResponse<T>> => {
  const { url, body, logger, ...rest } = options;
  const httpInstance = url.startsWith('https://') ? https : http;
  rest.method = rest.method ?? HttpMethod.GET;

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
          body: Utils.parseStringToJson(data),
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
