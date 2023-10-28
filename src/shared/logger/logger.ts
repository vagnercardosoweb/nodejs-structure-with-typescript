import process from 'node:process';

import { HOSTNAME, PID } from '@/config/constants';
import {
  Env,
  LoggerInterface,
  LoggerMetadata,
  LogLevel,
  Utils,
} from '@/shared';

class Logger implements LoggerInterface {
  constructor(private readonly id: string) {}

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
    if (metadata !== undefined) {
      metadata = Utils.redactedRecursiveKeys(metadata);
      message = Utils.replaceKeysInString(message, metadata);
    }
    process.stdout.write(
      `${JSON.stringify({
        id: this.id,
        level,
        pid: PID,
        hostname: HOSTNAME,
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
