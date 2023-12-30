import type { Request, Response } from 'express';

import { environments } from '@/config/environments';
import { Common } from '@/shared/common';

export class HealthyHandler {
  public static handle(request: Request, _: Response) {
    return {
      data: '🚀',
      path: `${request.method} ${request.originalUrl}`,
      ipAddress: request.ip,
      duration: request.durationTime.format(),
      timezone: environments.TZ,
      environment: environments.NODE_ENV,
      hostname: environments.HOSTNAME,
      requestId: request.requestId,
      userAgent: request.headers['user-agent'],
      brlDate: Common.createBrlDate(),
      utcDate: Common.createUtcDate(),
    };
  }
}
