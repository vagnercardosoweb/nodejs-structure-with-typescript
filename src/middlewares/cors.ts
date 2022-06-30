import { NextFunction, Request, Response } from 'express';

import configCors from '@/config/cors';

export const corsMiddleware = (
	request: Request,
	response: Response,
	next: NextFunction,
) => {
	response.header('Access-Control-Allow-Origin', configCors.origin);
	response.header('Access-Control-Allow-Methods', configCors.methods.join(','));
	response.header('Access-Control-Allow-Headers', configCors.headers.join(','));
	response.header('Access-Control-Allow-Credentials', 'true');

	if (request.method.toUpperCase() === 'OPTIONS') {
		return response.sendStatus(200);
	}

	return next();
};
