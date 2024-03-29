import type { Request, Response } from 'express';

import { environments } from '@/config/environments';
import { createNewBrlDate, createNewUtcDate } from '@/shared/date';

export class Healthy {
  public static handle(request: Request, response: Response) {
    return response.json({
      data: '🚀',
      path: `${request.method} ${request.originalUrl}`,
      ipAddress: request.ip,
      duration: request.durationTime.format(),
      timezone: environments.TZ,
      environment: environments.NODE_ENV,
      hostname: environments.HOSTNAME,
      requestId: request.requestId,
      userAgent: request.headers['user-agent'],
      brlDate: createNewBrlDate(),
      utcDate: createNewUtcDate(),
    });
  }
}
