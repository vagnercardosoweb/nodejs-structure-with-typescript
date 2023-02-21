import { IncomingHttpHeaders } from 'node:http';
import https, { RequestOptions } from 'node:https';

import { HttpMethod, HttpStatusCode } from '@/enums';
import { AppError, GatewayTimeoutError, InternalServerError } from '@/errors';
import { Util } from '@/shared/util';

export interface HttpRequest extends RequestOptions {
  url: string;
  body?: string;
  method?: HttpMethod;
}

export interface HttpResponse<T = any> {
  body: T;
  statusCode: number;
  headers: IncomingHttpHeaders;
}

const makeError = (externalError: any, metadata: any) => {
  const error =
    externalError instanceof AppError
      ? externalError
      : new InternalServerError({
          metadata,
          message: externalError.message,
          originalError: externalError,
        });
  error.stack = externalError.stack;
  return error;
};

export const httpRequest = async <T = any>(
  options: HttpRequest,
): Promise<HttpResponse<T>> => {
  const { url, body, ...rest } = options;
  rest.method = rest.method ?? HttpMethod.GET;
  const response = await new Promise<HttpResponse>((resolve, reject) => {
    const request = https.request(url, rest, async (res) => {
      const chunks: any[] = [];
      res.on('error', (e) => reject(makeError(e, options)));
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString().trim();
        const { statusCode = HttpStatusCode.OK, headers } = res;
        resolve({
          body: Util.parseJson(data),
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
  return response;
};
