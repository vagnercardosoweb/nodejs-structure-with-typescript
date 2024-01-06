import { setTimeout } from 'node:timers/promises';

import { isDecimal, isNumber } from '@/shared/number';

export const until = async (
  condition: () => Promise<boolean>,
  internal = 1,
) => {
  do {
    if (await condition()) return;
    await setTimeout(internal);
  } while (true);
};

export const isUndefined = (value: any): boolean => {
  return Object.prototype.toString.call(value) === '[object Undefined]';
};

export const removeUndefined = <T>(value: T): T => {
  return JSON.parse(JSON.stringify(value));
};

export const normalizeValue = (value: any) => {
  if (isDecimal(value)) {
    return parseFloat(value);
  }
  if (String(value)[0] !== '0' && isNumber(value)) {
    return Number(value);
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (value === 'null') {
    return null;
  }
  if (value?.toString() === 'undefined') {
    return undefined;
  }
  return value;
};

export const jsonParseOrDefault = <T = any>(
  json: any,
  defaultValue?: any,
): T => {
  if (Object.prototype.toString.call(json) === '[object Uint8Array]') {
    return JSON.parse(new TextDecoder().decode(json));
  }
  const normalizedJson = normalizeValue(json);
  if ([null, undefined, ''].includes(normalizedJson)) return json;
  if (typeof normalizedJson !== 'string') return normalizedJson;
  try {
    return JSON.parse(normalizedJson);
  } catch (e: any) {
    if (isUndefined(defaultValue)) throw e;
    return defaultValue;
  }
};
