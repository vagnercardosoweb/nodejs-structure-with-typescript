import http, { IncomingHttpHeaders } from 'node:http';
import https, { RequestOptions } from 'node:https';

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
  const { url, body, ...rest } = options;
  const httpInstance = url.startsWith('https://') ? https : http;
  rest.method = rest.method ?? HttpMethod.GET;
  return new Promise<HttpResponse>((resolve, reject) => {
    const request = httpInstance.request(url, rest, async (res) => {
      const chunks: any[] = [];
      res.on('error', (e) => reject(makeError(e, options)));
      res.on('data', (chunk) => chunks.push(chunk));
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
    request.on('timeout', () => request.destroy(new GatewayTimeoutError()));
    request.on('error', (e) => reject(makeError(e, options)));
    if (body?.trim()?.length) request.write(body);
    request.end();
  });
};
