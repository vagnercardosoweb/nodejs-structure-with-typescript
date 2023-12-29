import process from 'node:process';

import { Common } from '@/shared/common';

export const REDACTED_TEXT = process.env.REDACTED_TEXT || '[Redacted]';

export const redactRecursiveKeys = <T>(data: T, keys: string[] = []): T => {
  if (!Common.isArray(data) && !Common.isObject(data)) return data;

  const uniqueKeysAsLowerCase = new Set(
    (process.env.REDACTED_KEYS || '')
      .split(',')
      .concat(keys)
      .map((key) => key.trim().toLowerCase())
      .filter(Boolean),
  );

  if (uniqueKeysAsLowerCase.size === 0) return data;
  const result = Common.removeUndefined(data) as any;

  for (const key of Object.keys(result)) {
    const keyAsLower = key.toLowerCase();

    if (Common.isArray(result[key])) {
      result[key] = result[key].map((row: any) => {
        if (Common.isImageBase64(row)) return REDACTED_TEXT;
        return redactRecursiveKeys(row, keys);
      });
      continue;
    }

    if (Common.isObject(result[key])) {
      result[key] = redactRecursiveKeys(result[key], keys);
      continue;
    }

    if (
      uniqueKeysAsLowerCase.has(keyAsLower) ||
      Common.isImageBase64(result[key])
    ) {
      result[key] = REDACTED_TEXT;
    }
  }

  return result;
};
