import { HttpStatusCode } from '@/shared/enums';

import { AppError, Options } from './app';

export class GatewayTimeoutError extends AppError {
  public name = 'GatewayTimeoutError';

  constructor(options?: Options) {
    super({
      code: 'GATEWAY_TIMEOUT',
      statusCode: HttpStatusCode.GATEWAY_TIMEOUT,
      message: 'errors.gateway_timeout',
      ...options,
    });
  }
}
