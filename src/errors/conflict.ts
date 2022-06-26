import { HttpStatusCode } from '@/enums';

import { AppError, Options } from './app';

export class ConflictError extends AppError {
	constructor(options?: Options) {
		super({
			code: 'conflict',
			statusCode: HttpStatusCode.CONFLICT,
			message: 'error.conflict',
			...options,
		});

		this.name = 'ConflictError';
	}
}
