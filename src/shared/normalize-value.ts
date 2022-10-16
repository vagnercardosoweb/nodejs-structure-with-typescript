import { Util } from './util';

export const normalizeValue = (value: any) => {
  if (Util.isDecimal(value)) {
    return parseFloat(value);
  }
  if (Util.isNumber(value)) {
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
