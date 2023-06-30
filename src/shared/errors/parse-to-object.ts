import { AppError, HttpStatusCode } from '@/shared';

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
    sendToSlack: true,
    original: error,
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

  // check YUP errors
  if (error?.errors?.length > 0) {
    result.message = error.errors[0] as string;
    (result as any).validators = error.inner;
    result.statusCode = HttpStatusCode.BAD_REQUEST;
    result.sendToSlack = false;
  }

  // check ZOD errors
  if (error?.issues?.length > 0) {
    result.message = error.issues[0].message as string;
    (result as any).validators = error.issues;
    result.statusCode = HttpStatusCode.BAD_REQUEST;
    result.sendToSlack = false;
  }

  return result;
};
