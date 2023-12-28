export { default as Logger } from './logger';

export enum LogLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  WARN = 'WARN',
}

export type LoggerMetadata = {
  $logId?: string;
  $skipRedact?: boolean;
  [key: string]: any;
};

export interface LoggerInterface {
  getId(): string;
  withId(id: string): LoggerInterface;
  log(level: LogLevel, message: string, metadata?: LoggerMetadata): void;
  error(message: string, metadata?: LoggerMetadata): void;
  critical(message: string, metadata?: LoggerMetadata): void;
  info(message: string, metadata?: LoggerMetadata): void;
  warn(message: string, metadata?: LoggerMetadata): void;
}
