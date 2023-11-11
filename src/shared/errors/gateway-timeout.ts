import { HttpStatusCode } from '@/shared/enums';

import { AppError, AppErrorInput } from './app';

export class GatewayTimeoutError extends AppError {
  public name = 'GatewayTimeoutError';

  constructor(input?: AppErrorInput) {
    super({
      code: 'GATEWAY_TIMEOUT',
      statusCode: HttpStatusCode.GATEWAY_TIMEOUT,
      message: 'errors.gateway_timeout',
      ...input,
    });
  }
}
