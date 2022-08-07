import {
  createLogger,
  format,
  Logger as WinstonLogger,
  transports,
} from 'winston';

import { LogLevel, NodeEnv } from '@/enums';
import { Env } from '@/utils/env';

class Logger implements ILogger {
  private metadata: Record<string, any> = {};
  private readonly winston: WinstonLogger;

  constructor() {
    this.metadata.id = Env.get('LOGGER_ID', 'APP');
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
        const levelToUpper = level.replace(regex, (n) => n.toUpperCase());

        return JSON.stringify({
          id,
          pid: process.pid,
          level: levelToUpper,
          timestamp: `${timestamp} UTC`,
          message,
          metadata,
        });
      }),
    ];

    return formats;
  }

  private static getTransports() {
    return [new transports.Console()];
  }

  public log(level: LogLevel, message: string, metadata?: Metadata) {
    if (!Env.get('LOG_ENABLED', true)) {
      return;
    }

    const parseMetadata = { ...this.metadata, ...metadata };
    this.winston.log(level, message, parseMetadata);
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

  public addMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }
}

type Metadata = Record<string, any>;

interface ILogger {
  addMetadata(key: string, value: any): void;

  log(level: LogLevel, message: string, metadata?: Metadata): void;

  error(message: string, metadata?: Metadata): void;

  warn(message: string, metadata?: Metadata): void;

  info(message: string, metadata?: Metadata): void;
}

export default new Logger();
