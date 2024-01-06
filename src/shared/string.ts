import { randomBytes } from 'crypto';

export const BASE64_ENCODING = 'base64url';

export const isString = (value: any) => {
  return Object.prototype.toString.call(value) === '[object String]';
};

export const isValidUuid = (uuid: string) => {
  if (uuid.length !== 36) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid,
  );
};

export const ucFirst = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const stripTags = (value: string): string =>
  value.replace(/<[^>]+>/gm, '');

export const base64ToString = (value: string): string =>
  Buffer.from(value, BASE64_ENCODING).toString();

export const stringToBase64 = (value: string): string =>
  Buffer.from(value).toString(BASE64_ENCODING);

export const isBase64 = (value: string): boolean =>
  Buffer.from(value, BASE64_ENCODING).toString(BASE64_ENCODING) === value;

export const isBase64Image = (value: string): boolean => {
  return /^data:image\/(.*);base64,/.test(value);
};

export const generateRandomString = (length = 16): string =>
  randomBytes(length).toString(BASE64_ENCODING).slice(0, length);

export const removeAccents = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const removeLinesAndSpaces = (value: string): string =>
  value.replace(/\n/g, '').replace(/\s+/g, ' ').trim();

export const toCamelCase = (value: string): string =>
  value
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function replace(letter, index) {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/\s+|-+|_+/g, '');

export const toTitleCase = (value: string): string =>
  value.replace(/\w\S*/g, function replace(txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });

export const generateCharacters = (start: string, end: string): string => {
  const result = [];
  for (let i = start.charCodeAt(0); i <= end.charCodeAt(0); i++) {
    result.push(String.fromCharCode(i));
  }
  return result.join('');
};

export const strLimit = (value: string, limit: number, end = ''): string => {
  const lengthWithoutSpace = value.replace(/\s/g, '').length;
  if (limit > lengthWithoutSpace) return value;
  return (value.substring(0, limit) + end).trim();
};

export const replaceMustache = (
  message: string,
  context: Record<string, any>,
): string => {
  if (message?.indexOf('{{') === -1) return message;
  for (const key in context) {
    message = message.replaceAll(`{{${key}}}`, context[key]);
  }
  return message;
};

type ParseNameToPartsOutput = {
  firstName: string;
  middleName: string;
  lastName: string;
};

export const parseNameToParts = (name: string) => {
  const result: ParseNameToPartsOutput = {
    firstName: '',
    middleName: '',
    lastName: '',
  };

  const partsName = name
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w.trim());

  if (partsName.length === 0) return result;

  result.firstName = partsName.shift() as string;

  if (partsName.length > 0) {
    result.lastName = partsName.pop() as string;
    result.middleName = partsName.join(' ');
  }

  return result;
};

export const isCompleteName = (value: string): boolean => {
  return /[A-Za-zÀ-ÖØ-öø-ÿ]\s[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(value.trim());
};

export const hashFromString = (value: string): number => {
  let hash = 5381;
  let i = value.length;
  while (i) hash = (hash * 33) ^ value.charCodeAt(--i);
  return hash >>> 0;
};
