import 'vitest/globals';

import type { ContainerInterface } from '@/shared/container';
import type { DurationTimeInterface } from '@/shared/duration-time';
import type { JwtDecoded } from '@/shared/jwt';

declare global {
  export namespace Express {
    export interface Request {
      container: ContainerInterface;
      durationTime: DurationTimeInterface;
      originalMethod?: string;
      context: {
        language: string;
        requestId: string;
        awsTraceId?: string;
        awsRequestId?: string;
        jwt: JwtDecoded & {
          token: string;
          type: string;
        };
      };
    }
  }
}
