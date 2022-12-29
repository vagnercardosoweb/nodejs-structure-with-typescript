import os from 'os';
import { createLogger, format, transports } from 'winston';

import { LogLevel } from '@/enums';
import { Env } from '@/shared/env';

const PID = process.pid;
const HOSTNAME = os.hostname();
const LOG_ENABLED = Env.get('LOG_ENABLED', true);
const LOGGER_ID = Env.get('LOGGER_ID', 'APP');
const TZ = Env.get('TZ');

const winstonLogger = createLogger({
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
  silent: Env.isTesting(),
});

class Logger {
  constructor(private id = LOGGER_ID) {}

  public newInstance(id: string) {
    return new Logger(id);
  }

  public log(level: LogLevel, message: string, metadata?: Metadata) {
    if (!LOG_ENABLED) return;
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
