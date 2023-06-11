import os from 'node:os';

import {
  createLogger,
  format,
  Logger as WinstonLogger,
  transports,
} from 'winston';

import { Env, LoggerInterface, LoggerMetadata, LogLevel } from '@/shared';

class Logger implements LoggerInterface {
  protected readonly client: WinstonLogger;

  constructor(private readonly id: string) {
    this.client = createLogger({
      transports: [new transports.Console()],
      format: format.combine(
        ...[
          format.timestamp(),
          format.printf(({ level, message, timestamp, id, metadata }) => {
            return JSON.stringify({
              id,
              level: level.toUpperCase(),
              message,
              pid: process.pid,
              hostname: os.hostname(),
              timestamp,
              metadata,
            });
          }),
        ],
      ),
    });
  }

  public withId(id: string) {
    return new Logger(id);
  }

  public log(level: LogLevel, message: string, metadata?: LoggerMetadata) {
    if (Env.isTesting()) return;
    this.client.log(level, message, { id: this.id, metadata });
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
