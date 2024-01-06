import process from 'node:process';

import { isArray } from '@/shared/array';
import { isObject } from '@/shared/object';
import { isBase64Image } from '@/shared/string';
import { removeUndefined } from '@/shared/utils';

export const REDACTED_TEXT = process.env.REDACTED_TEXT || '[Redacted]';

export const redactRecursiveKeys = <T>(data: T, keys: string[] = []): T => {
  if (!isArray(data) && !isObject(data)) return data;

  const uniqueKeysAsLowerCase = new Set(
    (process.env.REDACTED_KEYS || '')
      .split(',')
      .concat(keys)
      .map((key) => key.trim().toLowerCase())
      .filter(Boolean),
  );

  if (uniqueKeysAsLowerCase.size === 0) return data;
  const result = removeUndefined(data) as any;

  for (const key of Object.keys(result)) {
    const keyAsLower = key.toLowerCase();

    if (isArray(result[key])) {
      result[key] = result[key].map((row: any) => {
        if (isBase64Image(row)) return REDACTED_TEXT;
        return redactRecursiveKeys(row, keys);
      });
      continue;
    }

    if (isObject(result[key])) {
      result[key] = redactRecursiveKeys(result[key], keys);
      continue;
    }

    if (uniqueKeysAsLowerCase.has(keyAsLower) || isBase64Image(result[key])) {
      result[key] = REDACTED_TEXT;
    }
  }

  return result;
};
