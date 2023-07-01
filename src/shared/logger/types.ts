import { LogLevel } from '@/shared';

export type LoggerMetadata = Record<string, any>;

export interface LoggerInterface {
  withId(id: string): LoggerInterface;
  log(level: LogLevel, message: string, metadata?: LoggerMetadata): void;
  error(message: string, metadata?: LoggerMetadata): void;
  critical(message: string, metadata?: LoggerMetadata): void;
  info(message: string, metadata?: LoggerMetadata): void;
  warn(message: string, metadata?: LoggerMetadata): void;
}
