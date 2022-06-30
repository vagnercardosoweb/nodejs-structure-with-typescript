import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

import { Env, Logger } from '@/utils';

export const loggerMetadataMiddleware = (
	request: Request,
	response: Response,
	next: NextFunction,
) => {
	const requestUuid = randomUUID();

	Logger.addMetadata('id', requestUuid);
	Logger.addMetadata('ipAddress', request.ip);

	response.setHeader('X-Request-Id', requestUuid);
	response.on('finish', () => {
		Logger.addMetadata('ipAddress', undefined);
		Logger.addMetadata('id', Env.get('LOGGER_ID', 'APP'));
	});

	return next();
};
