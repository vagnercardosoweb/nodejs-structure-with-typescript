import { createLogger, format, transports } from 'winston';

import {
  HOSTNAME,
  IS_TESTING,
  LOG_ENABLED,
  LOGGER_ID,
  PID,
  TZ,
} from '@/config/constants';
import { LogLevel } from '@/enums';

const winstonLogger = createLogger({
  silent: !LOG_ENABLED || IS_TESTING,
  transports: [new transports.Console()],
  format: format.combine(
    ...[
      format.timestamp(),
      format.printf(({ level, message, timestamp, id, ...metadata }) => {
        return JSON.stringify({
          id,
          level: level.toUpperCase(),
          message,
          pid: PID,
          hostname: HOSTNAME,
          timestamp: `${timestamp} ${TZ}`,
          metadata,
        });
      }),
    ],
  ),
});

class Logger {
  constructor(private id = LOGGER_ID) {}

  public newInstance(id: string) {
    return new Logger(id);
  }

  public log(level: LogLevel, message: string, metadata?: Metadata) {
    winstonLogger.log(level, message, { id: this.id, ...metadata });
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
