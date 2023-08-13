import { AppError } from '@/shared';

export const parseErrorToObject = (error: any): AppError => {
  if (error instanceof AppError) return error;

  const result = new AppError({
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

  if (error?.name) result.name = error.name;
  if (error?.stack) result.stack = error.stack;

  // check axios errors
  if (result.name.startsWith('Axios')) {
    const { status, data, config } = error.response;
    result.metadata = { status, data, config };
  }

  return result;
};
