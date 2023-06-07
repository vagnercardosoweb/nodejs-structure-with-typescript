import childProcess from 'node:child_process';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';

import moment from 'moment-timezone';

import { obfuscateKeys } from '@/config/obfuscate-keys';
import { InternalServerError, parseErrorToObject } from '@/errors';
import { Env, Logger } from '@/shared';

export class Util {
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

  public static randomStr(length = 16): string {
    let result = '';
    let stringLength = result.length;
    while (stringLength < length) {
      const size = length - stringLength;
      const bytes = randomBytes(size);
      result += Buffer.from(bytes).toString('base64url').slice(0, size);
      stringLength = result.length;
    }
    return result;
  }

  public static removeAccents(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f|\u00b4|\u0060|\u005e|\u007e]/g, '');
  }

  public static toCamelCase(value: string): string {
    return value.toLowerCase().replace(/^([A-Z])|[\s-_](\w)/g, (_, p1, p2) => {
      if (p2) {
        return p2.toUpperCase();
      }
      return p1.toLowerCase();
    });
  }

  public static toTitleCase(string: string): string {
    if (!string) return '';
    return string.replace(/\w\S*/g, function replace(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
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
    if (!result) result = Util.isDecimal(value);
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

  public static formatMoneyToBrl(
    value: number,
    options?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>,
  ): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(value);
  }

  public static async mkdirp(path: string): Promise<void> {
    await promisify(childProcess.exec)(`mkdir -p ${path}`);
  }

  public static isStringImageBase64(value: string): boolean {
    if (!Util.isString(value)) return false;
    return /data:image\/(.+);/gm.test(value);
  }

  public static obfuscateValue(data: any, keys: string[] = []) {
    if (!Env.get('OBFUSCATE_VALUE', true)) return data;
    if (!Util.isArray(data) && !Util.isObject(data)) return data;
    const result = Util.isArray(data) ? [...data] : { ...data };
    const hiddenKeys = [...keys, ...obfuscateKeys];
    const dataKeys = Object.keys(result);
    for (const key of dataKeys) {
      const value = result[key];
      if (Util.isObject(result[key])) {
        result[key] = Util.obfuscateValue(result[key]);
        continue;
      }
      if (Util.isArray(result[key])) {
        result[key] = result[key].map((row: any) =>
          Util.isStringImageBase64(row) ? '*' : Util.obfuscateValue(row),
        );
        continue;
      }
      if (hiddenKeys.includes(key) || Util.isStringImageBase64(value)) {
        result[key] = '*';
      }
    }
    return result;
  }

  public static getFirstAndLastName(value: string): {
    firstName: string;
    lastName: string;
  } {
    const slitName = value.split(' ');
    return {
      firstName: slitName[0],
      lastName: slitName
        .slice(1)
        .map((row) => row.trim())
        .join(' ')
        .trim(),
    };
  }

  public static formatDateYYYYMMDD(date: Date | number | string): string {
    return moment.tz(Util.parseDate(date), Env.get('TZ')).format('YYYY-MM-DD');
  }

  public static parseDate(date: DateParam): Date {
    if (this.isValidDate(date)) return date as Date;
    if (typeof date === 'number') return new Date(date);
    let newDate: DateParam | null = null;
    if (typeof date === 'string') {
      const [$date, $hour] = date.split(' ', 2);
      const $time = $hour ? ` ${$hour}` : ' 00:00:00';
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test($date)) {
        date = `${$date.split('/').reverse().join('/')}${$time}`;
      } else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test($date)) {
        date = `${$date}${$time}`;
      }
      newDate = new Date(date);
    }
    if (!newDate || !this.isValidDate(newDate)) {
      throw new InternalServerError({
        message: `Util.parseDate('${date}') received invalid date format in parameter.`,
        sendToSlack: true,
      });
    }
    return newDate;
  }

  public static isValidDate(date: DateParam): boolean {
    return date instanceof Date && !isNaN(date.getTime());
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

  public static async sleep(ms = 0): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  public static parseJson<T = any>(json: any, defaultValue?: any): T {
    const normalizedJson = this.normalizeValue(json);
    if ([null, undefined].includes(normalizedJson)) return defaultValue;
    if (typeof normalizedJson !== 'string') return normalizedJson;
    try {
      return {
        ...defaultValue,
        ...JSON.parse(normalizedJson),
      };
    } catch (e: any) {
      Logger.error('error parsing json', parseErrorToObject(e));
      return defaultValue;
    }
  }

  public static removeUndefined(value: Record<string, any>) {
    Object.keys(value).forEach((key) => {
      if (Object.prototype.toString.call(value[key]) === '[object Undefined]') {
        delete value[key];
      }
    });
    return value;
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

  public static base64ToString(value: string): string {
    return Buffer.from(value, 'base64').toString();
  }

  public static stringToBase64(value: string): string {
    return Buffer.from(value).toString('base64');
  }

  public static removeLinesAndSpaceFromSql(sql: string): string {
    return sql.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
  }

  static isString(value: any) {
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

  public static isUndefined(value: any): boolean {
    return Object.prototype.toString.call(value) === '[object Undefined]';
  }

  public static isObject(value: any): boolean {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  public static isArray(value: any): boolean {
    return Object.prototype.toString.call(value) === '[object Array]';
  }
}

type DateParam = number | string | Date;
