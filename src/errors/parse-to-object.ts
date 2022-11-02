import { HttpStatusCode } from '@/enums';

import { AppError } from './app';

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
  stack?: string[];
  statusCode: number;
  metadata: Metadata;
  originalError?: any;
  errorId: string;
  showInLogger: boolean;
}

export const parseErrorToObject = (error: any): Response => {
  let message = error?.message || error?.toString();
  let statusCode = error?.statusCode ?? HttpStatusCode.BAD_REQUEST;
  let validators: ValidatorError[] | undefined;
  const metadata = error?.metadata ?? {};
  const errorId = error?.errorId ?? AppError.generateErrorId();
  if ('inner' in error && Array.isArray(error?.errors)) {
    message = error.errors[0] ?? message;
    if (!error.inner?.length) error.inner.push({ ...error, inner: undefined });
    validators = error.inner;
  }
  if (error?.name?.startsWith('Sequelize')) {
    error.name = 'InternalServerError';
    message = `Internal error, please contact support with the following id [${errorId}]`;
    validators = error?.errors;
    statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
    if (error.original) {
      error.originalError = error.original;
      error.stack = error.original?.stack;
    }
  }
  return {
    name: error.name,
    code: error?.code ?? 'DEFAULT',
    statusCode,
    message,
    errorId,
    originalError: error?.originalError,
    metadata: { ...metadata, validators },
    stack: error?.stack?.split('\n'),
    showInLogger: error?.showInLogger ?? true,
  };
};
