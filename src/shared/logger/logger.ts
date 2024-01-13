import os from 'node:os';
import process from 'node:process';

import { LoggerInterface, LoggerMetadata, LogLevel } from '@/shared/logger';
import { redactRecursiveKeys } from '@/shared/redact-keys';

export class Logger implements LoggerInterface {
  constructor(protected readonly id: string) {}

  public getId(): string {
    return this.id;
  }

  public withId(id: string): LoggerInterface {
    return new Logger(id);
  }

  public log(level: LogLevel, message: string, metadata?: LoggerMetadata) {
    if (process.env.NODE_ENV === 'test') return;

    const skipRedact = metadata?.$skipRedact || false;
    const redactedKeys = metadata?.$redactedKeys || [];
    const logId = metadata?.$logId || this.id;

    delete metadata?.$skipRedact;
    delete metadata?.$redactedKeys;
    delete metadata?.$logId;

    const timestamp = new Date().toISOString();
    metadata = !skipRedact
      ? redactRecursiveKeys(metadata, redactedKeys)
      : metadata;

    process.stdout.write(
      `${JSON.stringify({
        id: logId,
        level,
        pid: process.pid,
        hostname: os.hostname(),
        timestamp,
        message,
        metadata,
      })}\n`,
    );
  }

  public error(message: string, metadata?: LoggerMetadata) {
    this.log(LogLevel.ERROR, message, metadata);
  }

  public critical(message: string, metadata?: LoggerMetadata) {
    this.log(LogLevel.CRITICAL, message, metadata);
  }

  public info(message: string, metadata?: LoggerMetadata) {
    this.log(LogLevel.INFO, message, metadata);
  }

  public warn(message: string, metadata?: LoggerMetadata) {
    this.log(LogLevel.WARN, message, metadata);
  }
}
