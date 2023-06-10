import { AppError, HttpStatusCode } from '@/shared';

export const parseErrorToObject = (error: any): AppError => {
  const requestId = error?.requestId;

  if (error instanceof AppError) {
    if (requestId && !error.requestId) error.requestId = requestId;
    return error;
  }

  const result = new AppError({
    code: error?.code,
    message: error.message,
    description: error?.description,
    errorId: error?.errorId,
    metadata: error?.metadata,
    statusCode: error?.statusCode,
    sendToSlack: true,
    logging: true,
    requestId,
  });

  result.name = error.name;
  if (error?.stack) result.stack = error.stack;

  // check axios errors
  if (result.name.startsWith('Axios')) {
    const { status, data, config } = error.response;
    result.name = AppError.mapperStatusCodeToName(status);
    result.metadata = { status, data, config };
  }

  if (
    error.name.startsWith('Sequelize') &&
    error.name !== 'SequelizeValidationError'
  ) {
    result.statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
    if (error.original) error.originalError = error.original;
  }

  // check YUP errors
  if (error?.errors?.length > 0) {
    result.message = error.errors[0] as string;
    (result as any).validators = error.inner;
    result.sendToSlack = false;
  }

  // check ZOD errors
  if (error?.issues?.length > 0) {
    result.message = error.issues[0].message as string;
    (result as any).validators = error.issues;
    result.sendToSlack = false;
  }

  return result;
};
