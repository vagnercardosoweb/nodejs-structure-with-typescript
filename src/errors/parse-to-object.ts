import { HttpStatusCode } from '@/enums';
import { AppError } from '@/errors';
import { Util } from '@/shared';

type ValidatorError = Record<string, any>;

export type OutputError = {
  name: string;
  code: string;
  statusCode: number;
  errorId: string;
  message: string;
  description: string;
  sendToSlack: boolean;
  metadata: Record<string, any>;
  validators: ValidatorError[];
  originalError: any;
  stack: string[];
};

export const parseErrorToObject = (error: any): OutputError => {
  let message = error?.message ?? error?.toString();
  const metadata = error?.metadata ?? {};
  let statusCode = error?.statusCode ?? HttpStatusCode.BAD_REQUEST;
  let validators: ValidatorError[] = [];
  const errorId = error?.errorId ?? AppError.generateErrorId();
  if (!Util.normalizeValue(error?.code)) error.code = 'api:default';

  let sendToSlack = Util.normalizeValue(error?.sendToSlack);
  if (sendToSlack === undefined) sendToSlack = true;

  // check error with yup validation
  if ('inner' in error && error?.errors?.length > 0) {
    validators = error.inner;
    message = error.errors[0] as string;
    sendToSlack = false;
  }

  // check error with zod validation
  // if (error instanceof z.ZodError && error?.issues?.length > 0) {
  //   validators = error.issues;
  //   message = validators[0].message;
  //   sendToSlack = false;
  // }

  if (
    error.name !== 'SequelizeValidationError' &&
    error.name?.startsWith('Sequelize')
  ) {
    statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
    if (error.original) {
      error.originalError = error.original;
      error.stack = error.original?.stack;
    }
  }

  return {
    name: error.name,
    code: error.code,
    statusCode,
    errorId,
    message,
    description: error?.description,
    sendToSlack,
    metadata,
    validators,
    originalError: error?.originalError ?? null,
    stack: error?.stack?.split('\n'),
  };
};
