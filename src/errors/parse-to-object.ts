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
  let statusCode = error?.statusCode ?? HttpStatusCode.BAD_REQUEST;
  let validators: ValidatorError[] = [];
  const errorId = error?.errorId ?? AppError.generateErrorId();

  let sendToSlack = Util.normalizeValue(error?.sendToSlack);
  if (sendToSlack === undefined) sendToSlack = true;

  // check error with yup validation
  if ('inner' in error && error?.errors?.length > 0) {
    validators = error.inner;
    message = error.errors[0] as string;
  }

  // check error with zod validation
  // if (error instanceof z.ZodError && error?.issues?.length > 0) {
  //   validators = error.issues;
  //   message = validators[0].message;
  // }

  if (error?.name?.startsWith('Sequelize')) {
    statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
    if (error.original) {
      error.originalError = error.original;
      error.stack = error.original?.stack;
    }
  }

  const metadata = error?.metadata ?? {};
  if (validators?.length > 0 && message !== 'errors.internal_server_error') {
    sendToSlack = false;
  }

  return {
    name: error.name,
    code: error?.code ?? 'API:DEFAULT',
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
