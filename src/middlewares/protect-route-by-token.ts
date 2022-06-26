import { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '@/errors';
import { Env, Jwt } from '@/utils';

const extractTokenInRequest = (request: Request): string => {
	let token = String(request.query.token).trim();
	const { authorization } = request.headers;

	if (authorization) {
		const [, authToken] = authorization.split(' ');
		token = authToken.trim();
	}

	if (token === 'undefined' || !token?.length) {
		throw new UnauthorizedError({
			message: 'Token missing in the request.',
		});
	}

	request.app.locals.token = token;

	return token;
};

async function validateJwtToken(request: Request) {
	try {
		request.app.locals.jwt = await Jwt.decode(request.app.locals.token);
	} catch (e: any) {
		throw new UnauthorizedError({
			message: e.message,
			originalError: e,
		});
	}
}

export const protectRouteByTokenMiddleware = async (request: Request, _response: Response, next: NextFunction) => {
	const token = extractTokenInRequest(request);

	if (token === Env.get('API_KEY')) {
		return next();
	}

	await validateJwtToken(request);

	return next();
};
