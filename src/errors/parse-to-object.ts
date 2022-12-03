// import { z } from 'zod';

import { HttpStatusCode } from '@/enums';
import { AppError } from '@/errors';
import { Translation } from '@/translations';

interface ValidatorError {
  type: string;
  path: string;
  message?: string;
  value?: any;
}

export const parseErrorToObject = (error: any) => {
  let message = error?.message || error?.toString();
  let statusCode = error?.statusCode ?? HttpStatusCode.BAD_REQUEST;
  let validators: ValidatorError[] = [];
  const errorId = error?.errorId ?? AppError.generateErrorId();
  if ('inner' in error && Array.isArray(error?.errors)) {
    message = error.errors[0] ?? message;
    if (!error.inner?.length) error.inner.push({ ...error, inner: undefined });
    validators = error.inner;
  }
  // if (error instanceof z.ZodError) {
  //   error.name = 'BadRequestError';
  //   validators = error.issues as any;
  //   message = validators?.at(0)?.message ?? message;
  //   error.stack = undefined;
  // }
  if (error?.name?.startsWith('Sequelize')) {
    statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
    validators = error?.errors;
    if (error.original) {
      error.originalError = error.original;
      error.stack = error.original?.stack;
    }
  }
  if (statusCode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
    error.name = 'InternalServerError';
    message = 'errors.internal_server_error';
  }
  const metadata = error?.metadata ?? {};
  return {
    name: error.name,
    code: error?.code ?? 'DEFAULT',
    statusCode,
    errorId,
    showInLogger: error?.showInLogger ?? true,
    message: Translation.get(message, { errorId, ...metadata }),
    description: error?.description,
    metadata,
    validators,
    originalError: error?.originalError ?? null,
    stack: error?.stack?.split('\n'),
  };
};
