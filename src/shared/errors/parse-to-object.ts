import { AppError } from '@/shared';

export const parseErrorToObject = (error: any): AppError => {
  const requestId = error?.requestId;

  if (error instanceof AppError) {
    if (requestId && !error.requestId) error.requestId = requestId;
    return error;
  }

  const result = new AppError({
    code: error?.code,
    errorId: error?.errorId,
    metadata: error?.metadata,
    description: error?.description,
    statusCode: error?.statusCode,
    originalError: error,
    sendToSlack: true,
    logging: true,
    requestId,
  });

  if (error?.name) result.name = error.name;
  if (error?.stack) {
    result.stack = error.stack;
  } else if (error?.message?.trim()) {
    result.message = error.message;
  }

  // check axios errors
  if (result.name.startsWith('Axios')) {
    const { status, data, config } = error.response;
    result.metadata = { status, data, config };
  }

  return result;
};
