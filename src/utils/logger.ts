import { createLogger, format, Logger as WinstonLogger, transports } from 'winston';

import { LogLevel, NodeEnv } from '@/enums';
import { Env } from '@/utils/env';

class Logger implements ILogger {
	private readonly winston: WinstonLogger;
	private globalMetadata: Record<string, any> = {};

	constructor() {
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
			format.printf(({ level, message, timestamp, loggerId = 'APP', ...metadata }) => {
				const regex = new RegExp(Object.keys(LogLevel).join('|'), 'ig');
				const levelToUpper = level.replace(regex, (level) => level.toUpperCase());

				return `[${levelToUpper}][${loggerId}](${timestamp}): ${message} ${JSON.stringify(metadata)}`;
			}),
		];

		if (!Env.get('IS_AWS_LAMBDA', false)) {
			formats.unshift(format.colorize());
		}

		return formats;
	}

	private static getTransports() {
		return [new transports.Console()];
	}

	public log(level: LogLevel, message: string, metadata?: Metadata) {
		if (!Env.get('LOG_ENABLED', true)) {
			return;
		}

		const parseMetadata = { ...this.globalMetadata, ...metadata };
		this.winston.log(level, message, parseMetadata);
	}

	public error(message: string, metadata?: Metadata) {
		this.log(LogLevel.ERROR, message, metadata);
	}

	public warn(message: string, metadata?: Metadata) {
		this.log(LogLevel.WARN, message, metadata);
	}

	public info(message: string, metadata?: Metadata) {
		this.log(LogLevel.INFO, message, metadata);
	}

	public addGlobalMetadata(key: string, value: any): void {
		this.globalMetadata[key] = value;
	}
}

type Metadata = Record<string, any>;

interface ILogger {
	addGlobalMetadata(key: string, value: any): void;

	log(level: LogLevel, message: string, metadata?: Metadata): void;

	error(message: string, metadata?: Metadata): void;

	warn(message: string, metadata?: Metadata): void;

	info(message: string, metadata?: Metadata): void;
}

export default new Logger();
