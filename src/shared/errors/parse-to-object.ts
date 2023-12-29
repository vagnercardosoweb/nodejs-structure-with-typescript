import { z } from 'zod';

import {
  AppError,
  INTERNAL_SERVER_ERROR_MESSAGE,
  UNAUTHORIZED_ERROR_MESSAGE,
} from '@/shared/errors';

import { zodError } from './zod';

export const parseErrorToObject = (error: any): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof z.ZodError) return zodError(error);

  let message = INTERNAL_SERVER_ERROR_MESSAGE;

  // from cognito
  if (error?.$metadata?.httpStatusCode) {
    error.statusCode = error.$metadata.httpStatusCode;
    if (error.name === 'NotAuthorizedException') {
      message = UNAUTHORIZED_ERROR_MESSAGE;
    }
  }

  const result = new AppError({
    message,
    code: error?.code,
    errorId: error?.errorId,
    metadata: error?.metadata,
    description: error?.description,
    statusCode: error?.statusCode,
    requestId: error?.requestId,
    originalError: error,
    sendToSlack: true,
    logging: true,
  });

  // check axios errors
  if (error.name.startsWith('Axios')) {
    const { status, data, config } = error.response;
    result.metadata = { status, data, config };
  }

  return result;
};
