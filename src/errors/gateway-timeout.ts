import { HttpStatusCode } from '@/enums';

import { AppError, Options } from './app';

export class GatewayTimeoutError extends AppError {
  constructor(options?: Options) {
    super({
      code: 'gateway_timeout',
      statusCode: HttpStatusCode.GATEWAY_TIMEOUT,
      message: 'error.gateway_timeout',
      ...options,
    });

    this.name = 'GatewayTimeoutError';
  }
}
