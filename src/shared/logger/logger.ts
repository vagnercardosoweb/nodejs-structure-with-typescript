import os from 'node:os';
import process from 'node:process';

import {
  Env,
  LoggerInterface,
  LoggerMetadata,
  LogLevel,
  Utils,
} from '@/shared';

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
    if (metadata) {
      metadata = Utils.obfuscateValues(metadata);
      message = Utils.replaceKeysInString(message, metadata);
    }
    const timestamp = new Date().toISOString();
    process.stdout.write(
      `${JSON.stringify({
        id: this.id,
        level: level.toUpperCase(),
        pid: this.pid,
        hostname: this.hostname,
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

export default new Logger('APP');
