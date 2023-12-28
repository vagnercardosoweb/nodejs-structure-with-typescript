import {
  defaultErrorMap,
  ErrorMapCtx,
  ZodError,
  ZodIssue,
  ZodIssueCode,
  ZodTooBigIssue,
  ZodTooSmallIssue,
} from 'zod';

import { HttpStatusCode } from '@/shared/enums';
import { UnprocessableEntityError } from '@/shared/errors';

const checkInvalidTypeZod = (issue: ZodIssue) =>
  issue.code === ZodIssueCode.invalid_type ||
  issue.code === ZodIssueCode.invalid_literal;

const parseZodMessage = (issue: ZodIssue): string => {
  const defaultMessage = defaultErrorMap(issue, {} as ErrorMapCtx).message;
  if (defaultMessage !== issue.message) return issue.message;

  if (
    issue.code === ZodIssueCode.too_big ||
    issue.code === ZodIssueCode.too_small
  ) {
    let key = issue.inclusive ? 'inclusive' : 'not_inclusive';
    if (issue.exact) key = 'exact';
    const translateKey = `schema.${issue.code}.${issue.type}.${key}`;

    if (issue.type === 'date') {
      const timestamp = ((issue as ZodTooBigIssue)?.maximum ??
        (issue as ZodTooSmallIssue)?.minimum) as number;
      (issue as any).isoDate = new Date(timestamp).toISOString();
    }

    return translateKey;
  }

  if (issue.code === ZodIssueCode.invalid_union) {
    issue = issue.unionErrors[0].issues[0];
    return parseZodMessage(issue);
  }

  if (issue.code === ZodIssueCode.invalid_string) {
    let translateKey = `schema.${issue.code}.default`;

    if (typeof issue.validation === 'object') {
      for (const key of Object.keys(issue.validation)) {
        if (issue.validation[key as keyof typeof issue.validation]) {
          translateKey = `schema.${issue.code}.${key}`;
          break;
        }
      }
    }

    return translateKey;
  }

  if (issue.code === ZodIssueCode.custom) return 'schema.default';
  return `schema.${issue.code}`;
};

export const zodError = (error: ZodError) => {
  let issue = error.issues[0];

  if (issue.code === ZodIssueCode.invalid_union) {
    issue = issue.unionErrors[0].issues[0];
  }

  const isInvalidType = checkInvalidTypeZod(issue);
  const requestId = (error as any)?.requestId;

  return new UnprocessableEntityError({
    message: parseZodMessage(issue),
    code: `SCHEMA.${issue.code}`.toUpperCase(),
    statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
    description: isInvalidType ? JSON.stringify(issue) : undefined,
    replaceKeys: { ...issue, path: issue.path.join('.') },
    sendToSlack: isInvalidType,
    logging: true,
    requestId,
  });
};
