import childProcess from 'node:child_process';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';

import { obfuscateKeys } from '@/config/obfuscate-keys';
import { BadRequestError, Env, Logger } from '@/shared';
import { HttpStatusCode } from '@/shared/enums';
import { parseErrorToObject } from '@/shared/errors';

export class Utils {
  public static DAY_IN_SECONDS = 86400;

  public static uuid(): string {
    return randomUUID();
  }

  public static ucFirst(value: string): string {
    const first = value.charAt(0).toUpperCase();
    return `${first}${value.slice(1)}`;
  }

  public static stripTags(value: string): string {
    return value.replace(/<[^>]+>/gm, '');
  }

  public static base64ToString(value: string): string {
    return Buffer.from(value, 'base64url').toString();
  }

  public static generateRandomString(length = 16): string {
    let result = '';
    let resultSize = result.length;
    while (resultSize < length) {
      const size = length - resultSize;
      const bytes = randomBytes(size);
      result += Buffer.from(bytes).toString('base64url').slice(0, size);
      resultSize = result.length;
    }
    return result;
  }

  public static removeAccents(value: string): string {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f|\u00b4|\u0060|\u005e|\u007e]/g, '');
  }

  public static toCamelCase(value: string): string {
    return value.replace(/^([A-Z])|[\s-_](\w)/g, (_, p1, p2) => {
      if (p2) {
        return p2.toUpperCase();
      }
      return p1.toLowerCase();
    });
  }

  public static toTitleCase(string: string): string {
    return string.replace(/\w\S*/g, function replace(txt) {
      return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
    });
  }

  public static rangeCharacters(startChar: string, endChar: string): string {
    return String.fromCharCode(
      ...this.rangeNumbers(
        endChar.charCodeAt(0) - startChar.charCodeAt(0) + 1,
        startChar.charCodeAt(0),
      ),
    );
  }

  public static convertObjectKeyToLowerCase<Params extends Record<string, any>>(
    object: Params,
  ): Params {
    return Object.entries(object).reduce((previousValue, [key, value]) => {
      previousValue[key.toLowerCase()] = value;
      return previousValue;
    }, {} as any);
  }

  public static rangeNumbers(size: number, start = 0): Array<number> {
    return [...Array(size).keys()].map((i) => i + start);
  }

  public static randomNumber(min: number, max: number): number {
    return randomInt(min, max);
  }

  public static onlyNumber(value: string | number): string {
    return `${value}`.replace(/[^\d]/gi, '');
  }

  public static isDecimal(value: string | number): boolean {
    return /^\d+\.\d+$/.test(value?.toString());
  }

  public static isNumber(value: string | number): boolean {
    let result = /^\d+$/.test(value?.toString());
    if (!result) result = Utils.isDecimal(value);
    return result;
  }

  public static toCents(value: number): number {
    return Math.round(value * 100);
  }

  public static toDecimal(value: number): number {
    return value / 100;
  }

  public static roundNumber(value: number, decimals = 2): number {
    return Math.round(Number(`${value}e${decimals}`)) / 100;
  }

  public static formatMoneyToBrl(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  public static async mkdirp(path: string): Promise<void> {
    await promisify(childProcess.exec)(`mkdir -p ${path}`);
  }

  public static isImageBase64(value: string): boolean {
    if (!Utils.isString(value)) return false;
    return /data:image\/(.+);/gm.test(value);
  }

  public static obfuscateValues<T>(data: T, keys: string[] = []): T {
    if (!Env.get('OBFUSCATE_VALUE', true)) return data;
    if (!Utils.isArray(data) && !Utils.isObject(data)) return data;

    const result = Utils.removeUndefined(data) as any;
    const uniqueKeys = new Set(keys.concat(obfuscateKeys));

    for (const key of Object.keys(result)) {
      const keyAsLower = key.toLowerCase();

      if (Utils.isObject(result[key])) {
        result[key] = Utils.obfuscateValues(result[key], keys);
        continue;
      }

      if (Utils.isArray(result[key])) {
        result[key] = result[key].map((row: any) => {
          if (Utils.isImageBase64(row)) return '*';
          return Utils.obfuscateValues(row, keys);
        });
        continue;
      }

      if (uniqueKeys.has(keyAsLower) || Utils.isImageBase64(result[key])) {
        result[key] = '*';
      }
    }

    return result;
  }

  public static parseNameToParts(name: string) {
    const result = {
      firstName: '',
      middleName: '',
      lastName: '',
    };

    const partsName = name.split(' ').map((w: string) => w.trim());
    if (partsName.length === 0) return result;

    result.firstName = partsName.shift() as string;

    if (partsName.length > 0) {
      result.lastName = partsName.pop() as string;
      result.middleName = partsName.join(' ');
    }

    return result;
  }

  public static formatDateYYYYMMDD(date: Date, timeZone?: string): string {
    return Intl.DateTimeFormat('fr-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone,
    }).format(date);
  }

  public static parseDateFromStringWithoutTime(dateAsString: string): Date {
    dateAsString = dateAsString as string; // type casting

    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateAsString)) {
      dateAsString = dateAsString.split('/').reverse().join('-');
    } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateAsString)) {
      dateAsString = dateAsString.split('-').reverse().join('-');
    }

    let date: Date | undefined;
    const match = dateAsString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    const [y, m, d] = match?.slice(1, 4).map((n) => Number(n)) ?? [0, 0, 0];
    if (match !== null) date = new Date(y, m - 1, d, 3, 0, 0, 0);

    if (!date || !this.isValidDate(date)) {
      throw new BadRequestError({
        message:
          'Invalid date "{{dateAsString}}", only "{{allowed}}" formats are accepted.',
        metadata: {
          allowed: ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD'],
          dateAsString,
        },
        sendToSlack: true,
      });
    }

    if (date.getDate() !== d) {
      throw new BadRequestError({
        message:
          'The date "{{dateAsString}}" entered is not valid, please check.',
        sendToSlack: false,
        metadata: {
          dateToIsoString: date.toISOString(),
          dateAsString,
        },
      });
    }

    return date;
  }

  public static isValidDate(date: DateParam): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  public static isValidCompleteName(value: string): boolean {
    return /[A-Za-zÀ-ÖØ-öø-ÿ]\s[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(value);
  }

  public static isValidPhone(value: string): boolean {
    const phone = Utils.onlyNumber(value);
    return phone.length === 11;
  }

  public static calculateAge(birthday: Date): number {
    const today = new Date();
    const age = today.getFullYear() - birthday.getFullYear();
    const month = today.getMonth() - birthday.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthday.getDate())) {
      return age - 1;
    }
    return age;
  }

  public static parseBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
  }

  public static strLimit(value: string, limit: number, end?: '...'): string {
    const lengthWithoutSpace = value.replace(/\s/g, '').length;
    if (limit > lengthWithoutSpace) return value;
    return value.substring(0, limit) + end;
  }

  public static async sleep(ms = 1): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  public static async until(
    condition: () => boolean | Promise<boolean>,
    internal = 1,
  ) {
    do {
      if (await condition()) return;
      await Utils.sleep(internal);
    } while (true);
  }

  public static hashFromString(str: string): number {
    let hash = 5381;
    let i = str.length;
    while (i) hash = (hash * 33) ^ str.charCodeAt(--i);
    return hash >>> 0;
  }

  public static parseStringToJson<T = any>(json: any, defaultValue?: any): T {
    const normalizedJson = this.normalizeValue(json);
    if ([null, undefined, ''].includes(normalizedJson)) return defaultValue;
    if (typeof normalizedJson !== 'string') return normalizedJson;
    try {
      return { ...defaultValue, ...JSON.parse(normalizedJson) };
    } catch (e: any) {
      if (Utils.isUndefined(defaultValue)) throw e;
      Logger.error('ERROR_PARSE_JSON', parseErrorToObject(e));
      return defaultValue;
    }
  }

  public static removeUndefined<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  public static normalizeValue(value: any) {
    if (this.isDecimal(value)) {
      return parseFloat(value);
    }
    if (this.isNumber(value)) {
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
  }

  public static *generateChunks<T>(
    array: T[],
    size: number,
  ): Generator<T[], void> {
    for (let i = 0; i < array.length; i += size) {
      yield array.slice(i, i + size);
    }
  }

  public static base64ToValue(value: string): string {
    return Buffer.from(value, 'base64url').toString();
  }

  public static valueToBase64(value: any): string {
    return Buffer.from(value).toString('base64url');
  }

  public static normalizeSqlQuery(sql: string): string {
    return sql.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
  }

  public static isString(value: any) {
    return Object.prototype.toString.call(value) === '[object String]';
  }

  public static sortByAsc<T extends Record<string, any>>(
    array: T[],
    column: string,
  ): T[] {
    return array.sort((a, b) => {
      if (a[column] > b[column]) return 1;
      if (a[column] < b[column]) return -1;
      return 0;
    });
  }

  public static normalizeMoneyFromString(value: string): number {
    return Number.parseInt(value.replace(/[^0-9-]/g, ''), 10) / 100;
  }

  public static isUuid(uuid: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      uuid,
    );
  }

  public static isUndefined(value: any): boolean {
    return Object.prototype.toString.call(value) === '[object Undefined]';
  }

  public static isObject(value: any): boolean {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  public static isArray(value: any): boolean {
    return Object.prototype.toString.call(value) === '[object Array]';
  }

  public static isStatusError(status: HttpStatusCode): boolean {
    return status < HttpStatusCode.OK || status >= HttpStatusCode.BAD_REQUEST;
  }

  public static cloneObject<T>(original: T): T {
    return Object.assign(
      Object.create(Object.getPrototypeOf(original)),
      original,
    );
  }

  public static replaceKeysInString(
    message: string,
    metadata: Record<string, any>,
  ): string {
    if (message.indexOf('{{') === -1) return message;
    for (const key in metadata) {
      message = message.replace(`{{${key}}}`, metadata[key]);
    }
    return message;
  }

  public static createDateWithTimezone(date: Date, timeZone: string): Date {
    return new Date(
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        fractionalSecondDigits: 3,
        year: 'numeric',
        hourCycle: 'h23',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }).format(date),
    );
  }

  public static createBrlDate(date?: Date): Date {
    return Utils.createDateWithTimezone(
      date ?? new Date(),
      Env.getTimezoneBrl(),
    );
  }

  public static createUtcDate(date?: Date): Date {
    return Utils.createDateWithTimezone(
      date ?? new Date(),
      Env.getTimezoneUtc(),
    );
  }

  public static getNowInSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  public static getDiffDays(start: Date, end: Date): number {
    const diffInMs = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffInMs / (Utils.DAY_IN_SECONDS * 1000));
  }

  public static generateSlug(value: string): string {
    return Utils.removeAccents(value)
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '');
  }

  public static scapeSql(text: string) {
    return Utils.removeAccents(text).replace(/'/g, "''").toLocaleLowerCase();
  }
}

type DateParam = number | string | Date;
