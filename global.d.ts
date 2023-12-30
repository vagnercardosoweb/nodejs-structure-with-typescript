import 'vitest/globals';

import type { ContainerInterface } from '@/shared/container';
import type { DurationTimeInterface } from '@/shared/duration-time';
import { JwtDecoded } from '@/shared/jwt';

declare global {
  export namespace Express {
    export interface Request {
      container: ContainerInterface;
      durationTime: DurationTimeInterface;
      originalMethod?: string;
      awsTraceId: string;
      authorizationToken: string;
      skipRequestLog: boolean;
      awsRequestId: string;
      acceptLanguage: string;
      requestId: string;
      jwt: JwtDecoded & {
        token: string;
        type: string;
      };
    }
  }
}
