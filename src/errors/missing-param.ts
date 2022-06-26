import { Options } from './app';
import { BadRequestError } from './bad-request';

export class MissingParamError extends BadRequestError {
	constructor(options?: Options) {
		super({
			code: 'missing_param',
			message: 'error.missing_param',
			...options,
		});

		this.name = 'MissingParamError';
	}
}
