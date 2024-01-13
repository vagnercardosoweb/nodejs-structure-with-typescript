export const isArray = (value: any): boolean => {
  return Object.prototype.toString.call(value) === '[object Array]';
};

export function* generateChunks<T>(
  array: T[],
  size: number,
): Generator<T[], void> {
  if (size === 0) throw new Error('Size must be greater than 0');
  for (let i = 0; i < array.length; i += size) {
    yield array.slice(i, i + size);
  }
}

export const sortByAsc = <T extends Record<string, any>>(
  array: T[],
  column: keyof T,
): T[] => {
  return array.sort((a, b) => {
    if (a[column] > b[column]) return 1;
    return -1;
  });
};

export const sortByDesc = <T extends Record<string, any>>(
  array: T[],
  column: keyof T,
): T[] => {
  return array.sort((a, b) => {
    if (a[column] < b[column]) return 1;
    return -1;
  });
};
