import { NextFunction, Request, Response } from 'express';

import { errorToObject } from '@/utils';

const loggerRequestInformation = (request: Request, response: Response) => {
	// eslint-disable-next-line no-console
	console.error('error-request-information', {
		path: request.path,
		method: request.method,
		cookies: request.cookies,
		headers: request.headers,
		params: request.params,
		query: request.query,
		body: request.body,
		loggerId: response.getHeader('X-Logger-Id'),
	});
};

export const errorHandlerMiddleware = (error: any, request: Request, response: Response, next: NextFunction) => {
	if (response.headersSent) {
		return next(error);
	}

	const errorObject = errorToObject(error);

	response.statusCode = errorObject.statusCode;
	loggerRequestInformation(request, response);

	return response.json(errorObject);
};
