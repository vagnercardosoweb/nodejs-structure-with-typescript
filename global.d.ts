import {
  ContainerInterface,
  JwtDecoded,
  LoggerInterface,
  TranslationInterface,
} from '@/shared';

declare global {
  export namespace Express {
    export interface Request {
      logger: LoggerInterface;
      container: ContainerInterface;
      translation: TranslationInterface;
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
