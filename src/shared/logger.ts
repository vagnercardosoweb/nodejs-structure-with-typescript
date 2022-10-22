import os from 'os';
import {
  createLogger,
  format,
  Logger as WinstonLogger,
  transports,
} from 'winston';

import { LogLevel, NodeEnv } from '@/enums';
import { Env } from '@/shared/env';

class Logger {
  private readonly winston: WinstonLogger;

  constructor(private id = Env.get('LOGGER_ID', 'APP')) {
    this.winston = createLogger({
      transports: Logger.getTransports(),
      exceptionHandlers: Logger.getTransports(),
      silent: Env.get('NODE_ENV') === NodeEnv.TEST,
      format: format.combine(...Logger.getFormats()),
    });
  }

  private static getFormats() {
    const formats = [
      format.timestamp(),
      format.printf(({ level, message, timestamp, id, ...metadata }) => {
        const regex = new RegExp(Object.keys(LogLevel).join('|'), 'ig');
        level = level.replace(regex, (n) => n.toUpperCase());
        return JSON.stringify({
          id,
          level,
          message,
          metadata: {
            pid: process.pid,
            hostname: os.hostname(),
            timestamp: `${timestamp} UTC`,
            ...metadata,
          },
        });
      }),
    ];
    return formats;
  }

  private static getTransports() {
    return [new transports.Console()];
  }

  public newInstance(id: string) {
    return new Logger(id);
  }

  public log(level: LogLevel, message: string, metadata?: Metadata) {
    if (!Env.get('LOG_ENABLED', true)) return;
    this.winston.log(level, message, { id: this.id, ...metadata });
  }

  public error(message: string, metadata?: Metadata) {
    this.log(LogLevel.ERROR, message, metadata);
  }

  public info(message: string, metadata?: Metadata) {
    this.log(LogLevel.INFO, message, metadata);
  }

  public warn(message: string, metadata?: Metadata) {
    this.log(LogLevel.WARN, message, metadata);
  }
}

type Metadata = Record<string, any>;

export default new Logger();
