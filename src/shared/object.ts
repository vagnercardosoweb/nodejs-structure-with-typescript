import { isArray } from '@/shared/array';
import { removeUndefined } from '@/shared/utils';

export const isObject = (value: any): boolean => {
  return Object.prototype.toString.call(value) === '[object Object]';
};

export const cloneObject = <T>(original: T): T => {
  return Object.assign(
    Object.create(Object.getPrototypeOf(original)),
    original,
  );
};

export const convertKeyToLowerCase = <Params extends Record<string, any>>(
  object: Params,
): Params => {
  return Object.entries(object).reduce((previousValue, [key, value]) => {
    previousValue[key.toLowerCase()] = value;
    return previousValue;
  }, {} as any);
};

export const convertDeepKeyToLowerCase = <Params extends Record<string, any>>(
  value: Params,
): Params => {
  const result = removeUndefined(value) as any;

  for (const key of Object.keys(result)) {
    if (isObject(result[key])) {
      result[key] = convertDeepKeyToLowerCase(result[key]);
      continue;
    }

    if (isArray(result[key])) {
      result[key] = result[key].map((row: any) => {
        if (isObject(row)) return convertDeepKeyToLowerCase(row);
        return row;
      });
    }
  }

  return convertKeyToLowerCase(result);
};
