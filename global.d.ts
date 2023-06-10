import { Translation } from '@/shared';
import { ContainerInterface } from '@/shared/container';
import { LoggerInterface } from '@/shared/logger/logger';
import { JwtDecoded } from '@/shared/utils/jwt';

declare global {
  export namespace Express {
    export interface Request {
      logger: LoggerInterface;
      container: ContainerInterface;
      translation: Translation;
      context: {
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
