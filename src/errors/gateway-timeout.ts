import { HttpStatusCode } from '@/enums';

import { AppError, Options } from './app';

export class GatewayTimeoutError extends AppError {
  constructor(options?: Options) {
    super({
      code: 'GATEWAY_TIMEOUT',
      statusCode: HttpStatusCode.GATEWAY_TIMEOUT,
      message: 'errors.gateway_timeout',
      ...options,
    });

    this.name = 'GatewayTimeoutError';
  }
}
