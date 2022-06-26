import { randomInt } from 'crypto';

import { HttpStatusCode } from '@/enums';

interface ValidatorError {
	type: string;
	path: string;
	message?: string;
	value?: any;
}

interface Metadata {
	validators: ValidatorError[];

	[key: string]: any;
}

interface Response {
	code: string;
	name: string;
	message: string;
	originalMessage?: string;
	stack?: string[];
	statusCode: number;
	description?: string;
	metadata: Metadata;
	originalError?: any;
}

export const errorToObject = (error: any): Response => {
	let message = error?.message || error?.toString();
	let statusCode = error?.statusCode ?? HttpStatusCode.BAD_REQUEST;
	let validators: ValidatorError[] | undefined;

	const metadata = error?.metadata ?? {};
	const errorId = randomInt(100000000, 999999999);

	if ('inner' in error && Array.isArray(error?.errors)) {
		message = error.errors[0] ?? message;
		if (!error.inner?.length) error.inner.push({ ...error, inner: undefined });
		validators = error.inner;
	}

	if (error?.name?.startsWith('Sequelize')) {
		error.name = 'InternalServerError';
		message = `Internal error, please contact support with the following id: [${errorId}]`;

		validators = error?.errors;
		statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;

		if (error.original) {
			error.originalError = error.original;
			error.stack = error.original?.stack;
		}
	}

	const responseErrorToObject = {
		name: error.name,
		code: error?.code ?? 'default',
		statusCode,
		message,
		originalMessage: error?.metadata,
		description: error?.description,
		originalError: error?.originalError,
		metadata: { errorId, ...metadata, validators },
		stack: error?.stack?.split('\n'),
	};

	return responseErrorToObject;
};
