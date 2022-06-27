import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

import { Logger } from '@/utils';

export const generateRequestIdMiddleware = (_request: Request, response: Response, next: NextFunction) => {
	const requestUuid = randomUUID();
	Logger.addGlobalMetadata('loggerId', requestUuid);
	response.setHeader('X-Request-Id', requestUuid);

	return next();
};
