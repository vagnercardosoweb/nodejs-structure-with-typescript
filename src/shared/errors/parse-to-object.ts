import { z } from 'zod';

import { AppError } from '@/shared/errors';

import { zodError } from './zod';

export const parseErrorToObject = (error: any): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof z.ZodError) return zodError(error);

  const result = new AppError({
    code: error?.code,
    errorId: error?.errorId,
    metadata: error?.metadata,
    description: error?.description,
    statusCode: error?.statusCode,
    requestId: error?.requestId,
    originalError: error,
    shouldReplaceKeys: true,
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
