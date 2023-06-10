import os from 'node:os';

import {
  createLogger,
  format,
  Logger as WinstonLogger,
  transports,
} from 'winston';

import { Env, LogLevel } from '@/shared';

class Logger implements LoggerInterface {
  protected readonly client: WinstonLogger;

  constructor(private id = 'APP') {
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

  public log(level: LogLevel, message: string, metadata?: Metadata) {
    if (Env.isTesting()) return;
    this.client.log(level, message, { id: this.id, metadata });
  }

  public error(message: string, metadata?: Metadata) {
    this.log(LogLevel.ERROR, message, metadata);
  }

  public critical(message: string, metadata?: Metadata) {
    this.log(LogLevel.CRITICAL, message, metadata);
  }

  public info(message: string, metadata?: Metadata) {
    this.log(LogLevel.INFO, message, metadata);
  }

  public warn(message: string, metadata?: Metadata) {
    this.log(LogLevel.WARN, message, metadata);
  }
}

type Metadata = Record<string, any>;

export interface LoggerInterface {
  withId(id: string): LoggerInterface;

  log(level: LogLevel, message: string, metadata?: Metadata): void;

  error(message: string, metadata?: Metadata): void;

  critical(message: string, metadata?: Metadata): void;

  info(message: string, metadata?: Metadata): void;

  warn(message: string, metadata?: Metadata): void;
}

export default new Logger();
