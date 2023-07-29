import os from 'node:os';

import { Env, LoggerInterface, LoggerMetadata, LogLevel } from '@/shared';

class Logger implements LoggerInterface {
  protected readonly pid: number;
  protected readonly hostname: string;

  constructor(private readonly id: string) {
    this.pid = process.pid;
    this.hostname = os.hostname();
  }

  public withId(id: string) {
    if (id === undefined) id = 'APP';
    return new Logger(id);
  }

  public getId(): string {
    return this.id;
  }

  public log(level: LogLevel, message: string, metadata?: LoggerMetadata) {
    if (Env.isTesting()) return;
    const timestamp = new Date().toISOString();
    process.stdout.write(
      `${JSON.stringify({
        id: this.id,
        level: level.toUpperCase(),
        message,
        pid: this.pid,
        hostname: this.hostname,
        timestamp,
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

export default new Logger('APP');
