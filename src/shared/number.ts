export const roundNumber = (value: number, decimals = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

export const randomNumber = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const generateNumbers = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, i) => i + start);

export const onlyNumber = (value: string | number): string => {
  return `${value}`.replace(/[^\d]/gi, '');
};

export const isDecimal = (value: string | number): boolean => {
  return /^\d+\.\d+$/.test(value?.toString());
};

export const isNumber = (value: string | number): boolean => {
  let result = /^\d+$/.test(value?.toString());
  if (!result) result = isDecimal(value);
  return result;
};

export const toCents = (value: number): number => {
  return Math.round(value * 100);
};

export const toDecimal = (value: number): number => {
  return value / 100;
};

export const normalizeMoneyFromString = (value: string): number => {
  return Number.parseInt(value.replace(/[^0-9-]/g, ''), 10) / 100;
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
};
