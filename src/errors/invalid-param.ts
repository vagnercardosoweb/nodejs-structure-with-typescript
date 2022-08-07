import { Options } from './app';
import { BadRequestError } from './bad-request';

export class InvalidParamError extends BadRequestError {
  constructor(options?: Options) {
    super({
      code: 'invalid_param',
      message: 'error.invalid_param',
      ...options,
    });

    this.name = 'InvalidParamError';
  }
}
