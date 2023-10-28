import 'vitest/globals';

import type {
  ContainerInterface,
  DurationTimeInterface,
  JwtDecoded,
  LoggerInterface,
} from '@/shared';

declare global {
  export namespace Express {
    export interface Request {
      logger: LoggerInterface;
      container: ContainerInterface;
      originalMethod?: string;
      durationTime: DurationTimeInterface;
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
